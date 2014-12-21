{:title "Waiting for your future"
 :layout :post
 :tags  ["Clojure" "future" "concurrency"]
 :toc true}

 So, you've got an action that you want to run in parallel using multiple cores, in pure Java land you have the old fashioned Thread.start which takes a Runnable implementation, another option is the  [ExecutorService](http://docs.oracle.com/javase/6/docs/api/java/util/concurrent/ExecutorService.html)  which uses a pool to store a collection of reusable threads (in fact its the same pool that agents use).  Clojure on the other hand has the  [future](http://clojuredocs.org/clojure_core/clojure.core/future)  macro which takes a body of code and runs it on a seprate thread:


```clojure
(def f (future (println "hello")))
  
@f ; will block here until it executes 
```

Futures use an unbound thread pool which is good for IO bound actions, lets assume we have a sequence (a large one at that) that serves as an input to that heavy IO operation, we want to parallelize the operation on multiple cores, the naive approach will be:

```clojure
 (defn action [i]
    (Thread/sleep 4000)
    (println i))

(defn -main []
  (map (future (action %)) (range 1000)))
```

Running this code will result with no future run, the main thread will exit before any future gets the chance to execute (since its async), in order to wait for them to run we need to deref all futures,  

```clojure
 (defn -main []
  (map deref (map (future (action %)) (range 1000)))) 
```
This looks good and indeed when we run it we notice the following output

```clojure
0
1 
.. ; omitted for brevity 
.. 
31
nil nil nil  ; after a delay 
32
..
..
63 ; order is random 
```

So whats going on here? we a get a lot less concurrency then we'd like, what we see here is Clojure chunking in action, since the inner map is lazy we produce 32 futures in each chunk deref them and carry on to the next, we could force all futures by using doall:

```clojure
(defn -main []
  (map deref (doall (map (future (action %)) (range 1000)))))
```

This poses another problem, we issue 1000 future and hammer on, this might cause the IO target to grind into a halt (be it filesystem or remote web service), a more controled method is required.  One option is to use Java's own ExecutorService and submit actions into that (using a bounded pool) and in fact thats exactly what [pallet thread](https://github.com/pallet/pallet-thread)  enables us to do.

Now we want to implement two main requirements, the first generate a blocked amount of running actions, the second make sure not to block the execution of actions (by chunking for example) if threads are available to handle them:  

```clojure
(use '[pallet.thread.executor :only (executor execute)])  
 
(def pool
  (executor {:prefix "foo" :thread-group-name "foo-grp" :pool-size 4}))

(defn bound-future [f]
 {:pre [(ifn? f)]}; saves lots of errors
  (execute pool f))

(defn wait-on [futures]
  "Waiting on a sequence of futures, limited by a constant pool of threads"
  (while (some identity (map (comp not future-done?) futures))
    (Thread/sleep 1000) 
    )) 

(defn -main []
  (wait-on (map #(bound-future (fn []  (action %))) (range 1000))))
```

The print will now look like 

```clojure
0
1
2
3
; a short delay for the next 4 actions to kick into action
1
..
```

I found this method to offer a balance between the spread of work and predictable load on the target.
