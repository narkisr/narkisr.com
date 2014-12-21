; @layout  post
; @title  Nodifying your Clojure  
; @tag    Clojure Cljs nodejs javascript 



[:h2 "Intro"]
[:p "In this post ill cover how to integrate ClojureScript (cljs in short) with nodejs, the use case I was trying to solve was to write " (link "hubot" "http://hubot.github.com/") " integration script with a product Im working on."]

[:p "Hubot scripts are written using Coffeescript but iv really missed the power of Clojure under my finger tips so iv decided to write a nodejs library with all the main logic in cljs. I wanted to have a full development stack with build, dependency management and testing support."]

[:p "A key point to understand is that a cljs/node project is living on dual platforms at once, 
    it has dependencies rooted in its nodejs package.json file and some in its cljs project.clj not to mention two build procedures."]


[:h4 "Setting up:"]

[:p "The tool chain required in setting up a project include: "
 [:ul
  [:li (link "lein" "https://github.com/technomancy/leiningen") " the Clojure build tool we will be using "  (link "lein-cljsbuild" "https://github.com/emezeske/lein-cljsbuild") " plugin in order to compile our cljs code."] 
  [:li (link "npm" "https://npmjs.org/") " which is the nodejs package management tool, I highly recommend using " (link "nvm" "https://github.com/creationix/nvm") " for setting it up."]
  ]]

[:p "The project structure includes:"]

#-BASH
├── lib # our compiled cljs js file
├── Makefile # nodejs build tasks
├── node_modules # npm local libraries
├── package.json # npm dependencies
├── project.clj # lein cljs build and dependencies
├── src # cljs source
├── test # compiled test js file
└── test-cljs # cljs test code
BASH
 
[:p "The project.clj contains our cljs build settings and dependencies:"]

#-CLJ
(defproject celestial-node "0.1.0-SNAPSHOT"
  :description "Celestial nodejs integration"
  :url "https://github.com/narkisr/celestial-node"
  :license {:name "Apache V2" :url "https://www.apache.org/licenses/LICENSE-2.0.html"}
  :dependencies [[org.clojure/core.incubator "0.1.2"]
                 [org.bodil/redlobster "0.2.1"]
                 [litmus "0.2.0-SNAPSHOT"]]
  
  :plugins  [[lein-cljsbuild "0.3.0"]]
  
  :cljsbuild {
              :builds
              {:prod 
               {:source-paths ["src"]
                :compiler {
                           :target :nodejs
                           :output-to "lib/celestial.js"
                           :optimizations :simple
                           :pretty-print true}}
               :test
               {:source-paths ["test-cljs"]
                :compiler {
                           :target :nodejs
                           :output-to "test/celestial.js"
                           :optimizations :simple
                           :pretty-print true}}}}
  )
CLJ

[:p "Notice that there are two builds with two different outputs, one for production use (lib/celestial.js) and one for testing (test/celestial.js), 
    this enable us to keep test logic out of our production code (in fact the test run executes as a part of the main) , in order to build the cljs output we could run:"]

#-BASH
 # one time compilation
 $ lein cljsbuild once 
 # auto compilation on save
 $ lein cljsbuild auto
BASH

[:h4 "Testing:"]

[:p "Another key aspect is a testing framework, most cljs testing frameworks deal with testing browser code (and require phantom js), the only one that iv found to run well on nodejs and has a cljs DSL is " (link "litmus" "https://github.com/hsalokor/litmus") " which wrapps around " (link "mocha.js" "http://visionmedia.github.io/mocha/") ", currently its not up on Clojars so build it locally using lein install." ]

[:p "The following show cases how a litmus test looks like:"]

#-CLJ
 (describe "system manipulations"
   (given "we store a new system"  
      (it-async "creates a new id"    
        (create-system (slurp-edn "fixtures/redis-system.edn") 
            (fn [body] (reset! sys-id (aget body "id")) (done))
            (fn [error] (println "failed" error) (done))))
      (it-async "we can fetch it back"
        (get-system @sys-id 
            (fn [body] (equals? (aget body "type") => "redis") (done))
            (fn [error] (println error))))    
          ))
CLJ
[:p "Due to the async nature of nodejs we use done fn to mark when a test is indeed done, the DSL is BDD oriented, in order to run the tests we run the 'make test' defined in our Makefile (which is a part of the nodejs build system), the Makefile consists of: "]

#-BASH
REPORTER = dot
  
test:
        @NODE_ENV=test ./node_modules/.bin/mocha \
        --reporter $(REPORTER) \
        --ui tdd -t 3000
    
test-w:
        @NODE_ENV=test ./node_modules/.bin/mocha \
        --reporter $(REPORTER) \
        --growl \
        --ui tdd \
        --watch

package: clean
        lein cljsbuild once
        mkdir pkg
        cp lib/celestial.js pkg
        cp -r fixtures pkg
        
clean:  
      rm -rf pkg

.PHONY: test test-w
BASH

[:p "As you can see the test target invokes the mocha binary located under npm's node_modules library which is defined in the package.json file:"] 

#-JS
{
  "name": "celestial-node",
  "preferGlobal": false,
  "version": "0.1.0",
  "author": "Ronen Narkis <narkisr@gmail.com> (http://narkisr.com)",
  "description": "Celestial API for nodejs",
  "repository": {
    "type": "git",
    "url": ""
  },
  "license": "Apache-V2",
  "dependencies": {
    "npm": ">= 1.1.2",
    "request": "=2.21.0"
  },
  "scripts": {
    "test": "make test"
  },
  "devDependencies": {
    "chai": "*",
    "mocha": "*"
   },
  "optionalDependencies": {},
  "engines": {
    "node": "0.6 || 0.7 || 0.8"
  },
  "homepage": "",
  "main": "lib/celestial.js"
}
JS

[:h4 "Nodejs integration:"]

[:p "The package.json includes all our nodejs dependencies (remeber the duality part?), we can add and use any nodejs module from our cljs code, in order to use a nodejs module:"]

#-CLJ
; nodejs require
(def request (js/require "request")) 

; js interop usage
(defn GET [url s f]
  (.get request (<< "~(@conf :url)~{url}") (clj->js (opts)) (response- s f)))
CLJ


[:p "In order to expose cljs api to nodejs consumers we need to export a ns:"]

#-CLJ
(ns celestial.core ...)
 
(defn main [])

; required even if we don't use a main
(set! *main-cli-fn* main)

; export this ns as a part of nodejs module
(aset js/exports "core" celestial.core)
CLJ

[:p "With that all in place we can require our cljs module from any other npm enabled project:"]

#-JS
{
  "name": "hubot-celestial",
  "version": "0.0.1",
  "description": "Hubot script for interacting with Celestial",
  "main": "main.js",
  "scripts": {
  },
  "repository": "git://github.com/narkisr/hubot-celestial.git",
  "author": "narkisr.com",
  "license": "Apache-V2",
  "dependencies": {
    "coffee-script": "~1.4.0",
    "hubot": "~2.4.8",
    "hubocator": "0.1.2",
    "cli-table" : "0.2.0",
    "underscore" :"1.4.4",
    "celestial-node":"git://github.com/narkisr/celestial-node.git"
  }
}
JS

[:p "Requiring the api:"]

#-JS
celestial = require ('celestial-node')
celestial.core.get_system(id,((b)-> msg.send systemTable(b)), ((e)-> msg.send e))
JS

[:h2 "Summary"]
[:p "Iv found cljs and nodejs to be a very powerfull (yet a bit young) combo to work with, it offers yet another very rich platform to run Clojure code on top of. I hope you will find it useful too."]

[:h4 "Footnotes:" ]
[:ul
  [:li (link  "celestial-node" "https://github.com/narkisr/celestial-node") "(most of the code preseted)"] 
  [:li  (link "hubot-celestial" "https://github.com/narkisr/hubot-celestial")] 
  ]
