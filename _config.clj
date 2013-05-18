{
 ;; directory setting
 :public-dir   "public/"
 :tag-out-dir  "tag/"
 :template-dir "template/"
 :post-dir     "posts/"
 :layout-dir   "layouts/"

 ;; posts and tags url setting
 ;;   default value: "/"
 ;;   ex)
 ;;     "/"    => "/YYYY-MM/POST.html"
 ;;     "/foo" => "/foo/YYYY-MM/POST.html"
 :url-base     "/"

 ;; dev server port
 ;;   default value: 8080
 :port 8080

 ;; site language
 ;;   default value: "en"
 :lang "en"

 ;; default site data
 :site {:charset    "utf-8"
        :site-title "narkisr.com"
        :twitter    "narkisr"
        :js ["js/run_prettify.js" "js/lang-clj.js" "js/jquery-1.7.2.min.js"
             "js/bootstrap.min.js" "js/main.js" ]
        :css  ["css/bootstrap.min.cerulean.css" "css/bootstrap-responsive.min.css"
               "css/docs.css" "css/prettify.css" "css/font-awesome.min.css"]
        :root "/"
        }

 ;; post file compile hook
 :compile-with-post ["index.html.clj" "atom.xml.clj"]

 ;; tag setting
 :tag-layout "tag"

 ;; post setting
 :post-filename-regexp #"(\d{4})[-_](\d{1,2})[-_](\d{1,2})[-_](.+)$"
 :post-filename-format "{{year}}-{{month}}/{{filename}}"

 ;; post sort type (:date :name :title :date-desc :name-desc :title-desc)
 ;;   default value: :date-desc
 :post-sort-type :date-desc

 ;; clojurescript compile options
 ;; src-dir base is `:template-dir`
 ;; output-dir base is `:public-dir`
 :cljs {:src-dir       "cljs"
        :output-to     "js/main.js"
        :optimizations :whitespace
        :pretty-print true}

 :compiler  ["default" "cljs"]

 ;; highlight setting
 :code-highlight {:CLJ "lang-clj", :CLOJURE "lang-clj", :BASH "lang-bsh" :JS "lang-js"}

 ;; flag for detailed log
 ;;   default value: false
 :detailed-log false
 }

