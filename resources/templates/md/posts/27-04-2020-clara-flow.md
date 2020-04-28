{:title "Rules, not what you recall"
 :layout :post
 :tags  ["re-ops" "functional" "flows" "clara"]
 :toc false}

### Intro

Like most developers I used to think on rule engines as a interesting technology that never took off, a common misconception around them was that they would enable domain experts to encode rules into them without the need of having developers in this process (reducing cost/implementation time).

As expected this never worked in practice and as projects failed interest dwindled and they were left as an historical relic together with [visual programming](https://en.wikipedia.org/wiki/Visual_programming_language).

In this post I will try to revive the interest in using a rule engine and cover how I use [Clara rules](https://github.com/cerner/clara-rules) in an interesting domain - operation flow automation.


### So what are rule engines?

A Rule engine include 3 main types of components:

* Facts, information that our system get from the world.
* Rules, how those facts effect our world
* Queries that we may run in order to find what kind of rules were activate and why.


The underlying implementation uses a directed acyclic graph and an algorithm named [RETE](https://en.wikipedia.org/wiki/Rete_algorithm) for efficient computation on top of a large sets of rules and facts.

<small> * If the above rings a bell of Logic programming and expert system you are not mistaken with the later usually being implemented in Prolog.</small>

A basic rule in Clara is composed from a left hand side (a match on facts) and the right hand side (the effect of a match) separated by '=>', in this case we match on facts that have a :state value of ::start :

```clojure
(ns foo)

(defrule example
  "An example rule"
  ; What to match on
  [?e <- ::start]
  =>
  ; The effect of the match
  (println "foo")
  (insert! {:state ::done :failure false}))
```

Lets note a couple of interesting points here:

* The RHS doesn't have to be side effect free! (see that lovely println)
* The RHS can insert new facts into the system.
* We can capture the incoming matched fact in variables (?e), this allows us to pass in arbitrary information to the rules.
* Our facts are plain old Clojure maps (we can create them from any arbitrary input).

Our rule engine state (RETE remember?) is an immutable data structure ([turtles](https://en.wikipedia.org/wiki/Turtles_all_the_way_down) all the way down) that we store in an atom:

```clojure
(defn initialize []
  (atom (mk-session 'foo)))

(def session (initialize))
```
If we want to insert new facts into it (while keeping our old view of the world) we can just reset it:

```clojure
(defn update- [facts]
  (let [new-facts (reduce (fn [s fact] (insert s fact)) @session facts)]
    (reset! session (fire-rules new-facts))))

(commment
  ; update our view of the world
  (update- {:state :foo/start :yet :another :key 1}))
```

We can also query our session and ask what happened:

```clojure
(defquery get-failures
  "Find all failures"
  []
  [?f <- :re-flow.core/state (= true (this :failure))])
```

## Existing approaches

Lets take a step back and cover what a conditional is composed out of:

* A predicate (the when of an IF statement).
* The result of a match on a predict (the logic that happens after a match).
* The computation flow (the cause and effect graph).

We use conditional logic when we try to describe the flow of steps in a distributed process like  for example a remote backup restore test:

* Create a VM with a volume to restore our data to
* Provision the VM with the required tooling and prepare our volume
* Check that we are ready to start the restore process (our VM is ready and our volume has the correct size)
* Restore the data and verify that it was successful
* Notify on success or failure

There are a number of ways to model this kind of flow, the simplest one is to use conditionals:

```clojure
(defn restore-backup [backup]
  (let [{:keys [created?] :as creation-result} (create-vm)]
     (if-not vm-create?
         (throw (ex-info "failed to create the VM" creation-result))
         (let [{:keys [provisioned?] :as provisioning-result} (provision)]
            ; rest of the flow
            ))))
```

There are a number of issue with this approch:

* As [Cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity) explodes its really hard to reason about the code.
* Composition is challenging since trying to compose one chain of conditional logic with another is fragile.
* The only way to understand failure points in the code is by painstaking debugging and printing.


Another approach is to use finite state machines (FSM for short), the following FSM has a :start state and a number of transitions defined:
```clojure
(defsm restore
  [[:start
    ::create -> (create-vm)]
   [:created
    true ->  (provision)
    false -> (report-error)]
   [:provisioned
    true ->  (restore)
    false -> (report-error)]
  [:restored
    true ->  (printrln "success")
    false -> (report-error)]
   ])
```

On a first glance this looks promising as it frees us from the conditional nesting but there are still a number of issues:

* Location information is still complected making change in a large set of FMS's is still tricky.
* They are not easy to compose (think about combining the restore FSM with a new notification FSM)
* They lack introspection (understand why we reached a certain state within them).

There are other approaches that solve the same problem but I would like to claim (while not providing a rigorous mathematical proof) that they are <a href="https://en.wikipedia.org/wiki/Reduction_(complexity)">reducible </a> to the two approaches mentioned above.


### The case fore Clara rules

Coming back to the same problem space (restoration flow) our code now is composed out of a two sets of rules, the first one is the creation and provisioning logic:

```clojure
(ns re-flow.setup
  ;...
  )

(defrule creating
  "Create VM"
  [?e <- ::creating []]
  =>
  (insert! (assoc ?e :state ::created :failure (create-vm)))


(defrule provisioning
  "Provisioning"
  [?e <- ::created (= ?failure false)]
  =>
   ; ....
   (info "provisioning")
   (insert! (assoc ?e :state ::provisioned :failure (provision))))
```

Note that we didn't specify the order of execution we only provided the predicate and the effect of a match.

Our restoration logic is completely decoupled from the creation logic (it resides in a different namespace), it does not care on how the instance is coming to life it only concern itself with what it should do once its up and running:

```clojure
(ns re-flow.restore
  ;...
  )

(defrule check
  "Check that the ?e fact is matching the ::restore spec"
  [?e <- ::start]
  =>
  (insert! (assoc ?e :state ::spec :failure (not (s/valid? ::restore ?e)))))

(defrule create
  "Triggering the creation of the instance"
  [?e <- ::spec [{:keys [failure]}] (= failure false)]
  =>
  (info "Starting to run setup instance")
  (insert!  (assoc ?e :state :re-flow.setup/creating :spec instance)))

(defrule restore
  "Restoring information"
  [?e <- ::provisioned [{:keys [failure]}] (= failure false)]
  =>
  (insert! (assoc ?e :state ::restored :failure (restore)))
```

The check rule matches on the ::start state fact where ?e is captured and verified against a spec, the second rule trigger the creation flow if the ::spec fact failure value is false.

In order to launch this flow we insert a fact into our session:

```clojure
; We provide the backup information as a map within the fact
(update- {:state :re-flow.restore/start :backup {:source "s3://" ...})
```

We may use the query we already defined to find what rule fail:

```clojure
(defn run-query [q]
  (query @session q))

; The query result is a native Clojure datastucture
(run-query get-failures)
```

This approach has a number of clear advantages:

* Logic is decoupled its easy to make changes to one rule without breaking other rules.
* Composition is easy, one set of rules can trigger other rules from other namespaces.
* Tracking failure and other information is easy (just write queries)
* We get the execution engine for free (computation graph).

A number of other key points that we should cover:

* The engine does not deal with concurrency however its immutable which allows us to set the new engine state using native Clojure Refs.
* The Rules are not persisted to disk by default if we choose to do so we can serialize its state and persist it.
* The engine state is not a distributed data structure, if we have multiple JVM's we can shard our facts based on keys (think Kafka consumers).

### Summary

Iv found Clara rules to be a really powerful tool for automation if you are curious check [Re-core](https://github.com/re-ops/re-core/tree/master/src/re_flow) code, ill conclude this post with my own variation on Greenspuns tenth [rule](https://en.wikipedia.org/wiki/Greenspun%27s_tenth_rule):


"Every complex yml/json that describes a complex pipeline is interpreted by an ad hoc informally-specified, bug-ridden, slow implementation of a Forward-chaining rules engine"

  Pipelines are computation graphs


#### Footnotes:
* <small>Martin fowler mentioning the [misconception](https://martinfowler.com/bliki/RulesEngine.html).</small>
* <small>The connection between Expert [systems](https://en.wikipedia.org/wiki/Expert_system) and rule engines.</small>


