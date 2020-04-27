(defproject narkisr.com "0.2.0"
            :description "Narkisr.com web site"
            :url "http://narkisr.com"
            :license {:name "Creative Commons Attribution 3.0 Unported License"
                      :url "http://creativecommons.org/licenses/by/3.0/"}
            :dependencies [[org.clojure/clojure "1.8.0"]
                           [ring/ring-devel "1.6.3"]
                           [compojure "1.6.0"]
                           [ring-server "0.5.0"]
                           [cryogen-markdown "0.1.7"]
                           [cryogen-core "0.1.60"]]
            :plugins [[lein-ring "0.12.5"]]
            :main cryogen.core
            :ring {:init cryogen.server/init
                   :handler cryogen.server/handler})
