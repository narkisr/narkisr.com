(defproject celestial-ops.com "0.0.1"
  :description "celestial-ops website"
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [misaki "0.2.6.1-beta"]
                 [narkisr/misaki-clostache "0.0.3-alpha"]
                 ; cljs compiler
                 [jayq "0.1.0-alpha2"]
                 [org.clojure/clojurescript "0.0-1586"]]

  
  :aliases        {"all" ["with-profile" "dev"]}

  :repositories [["sonatype-snapshots"
                  "https://oss.sonatype.org/content/repositories/snapshots/"]]

 
  :main misaki.server)
