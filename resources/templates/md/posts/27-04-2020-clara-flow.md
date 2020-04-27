{:title "Rules, not what you expected"
 :layout :post
 :tags  ["re-ops" "functional" "flows" "clara"]
 :toc false}

### Intro

Like most developers I used to think on rule engines as a interesting technology that never took off with one of the oldest examples being [Drools](https://www.drools.org/).

A common misconception was that they were meant replace developers with domain experts enabling them to bash rules into the system reducing cost/development time, as projects failed interest dwindled and they were left as an historical relic together with [visual programming](https://en.wikipedia.org/wiki/Visual_programming_language).

In this post I will cover [Clara rules](https://github.com/cerner/clara-rules) and how it can be used to automate complex operation flows, I would even date going further and add my variation on Greenspuns tenth [rule](https://en.wikipedia.org/wiki/Greenspun%27s_tenth_rule):


"Every complex yml/json that describes a complex pipeline is interpreted by an ad hoc informally-specified, bug-ridden, slow implementation of a Forward-chaining rules engine"

  Pipelines are computation graphs


## So what are rule engines?

A Rule engine include 3 types of entities:

* Facts, information that our system get from the world.
* Rules, how those facts effect our world
* Queries, what kind of activation of rules happened in our system


The underlying implementation uses a directed acyclic graph and an algorithm named [RETE](https://en.wikipedia.org/wiki/Rete_algorithm) for efficient computation on top of a large sets of rules and facts.

<small>If the above rings a bell of Logic programming and expert system you are not mistaken with the later usually being implemented in Prolog.</small>

## Example please

A basic rule in Clara is composed from a left hand side (a match) and the right hand side (the effect of a match) seprated by '=>', in this case we match on facts that have a :state key of ::start:

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

Couple of items to note at this point are:

* The RHS doesn't have to be side effect free! (see that lovely println)
* The RHS can insert new facts into the system
* Our facts are plain old Clojure maps

Our Rules graph state (RETE remember?) like anything in Clojure is an immutable data structure ([turtles](https://en.wikipedia.org/wiki/Turtles_all_the_way_down)):

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

## Rules! what are they good for?

Taking a step back Rules engines abstract 3 key points around conditional logic:

* A predicate (the when of an IF statement)
* The result of a match on a predict (the logic that happens after a match)
* The flow (which rule follows each rule

We use conditional logic when we try to describe the flow of behaviour, for example a backup restore process:

* Create a VM with a volume to restore our data to
* Provision the VM with the required tooling and prepare our volume
* Check that we are ready to start the restore process (our VM is ready and our volume has the correct size)
* Restore the data and verify that it was successful
* Notify on success or failure

There are a number of ways to model this kind of flow, the naive one is to use conditionals:

```clojure
(defn restore-backup [backup]
  (let [{:keys [created?] :as creation-result} (create-vm)]
     (if-not vm-create?
         (throw (ex-info "failed to create the VM" creation-result))
         (let [{:keys [provisioned?] :as provisioning-result} (provision)]
            ; rest of the flow
            ))))
```

This code is brittle and hard to test, its also hard to re-used this code (composition is key) we have three things complected for each conditional (the predicate the result and the location)

Another more sophisticated method is using state machines, this FSM has a :start state and it transitions from one state to the next:
```clojure
(defsm restore
  [[:start
    ::create -> (create-vm)]
   [:created
    true ->  (provision)
    false -> (report-error)]
   [:provisioned
    true ->  :provision
    false -> (report-error)]
   ])
```

On a first glance this looks promising as it frees us from the conditional nesting however the order information is still explicit (similar to conditional logic) making change in large sets of FMS's challenging (imaging trying to combine 100's of FMS manually).

#### Footnotes:
* <small>Martin fowler mentioning the [misconception](https://martinfowler.com/bliki/RulesEngine.html).</small>
* <small> The connection between Expert [systems](https://en.wikipedia.org/wiki/Expert_system) and rule engines.</small>


