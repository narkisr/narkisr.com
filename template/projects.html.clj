; @title  default title
; @format html5
; @layout  default



[:div {:class "page-header"}
  [:h1 "Open source projects"]]

[:p "This page comes to sort though some of the more notable open source projects iv realease during the years, note that there are more interesting projects lists under my " (link "github" "https://github.com/narkisr") " account, ranging from " (link "puppet" "http://puppetlabs.com/") " modules, " (link  "dot-files" "https://github.com/narkisr/.vim") " and notable projects as listed bellow , feel free to " (link "tweet" "http://twitter.com/narkisr") " me about any of these."]

[:div {:class "row"}
 [:div {:class "span4"}
  [:h3 "Couchfuse"] 
  [:p "Coucfuse is a FUSE file system implementation for the Couchdb nosql database, it enables the mount of a database and manipulation of documents, each document is mapped into a content and meta folders, " (link "see" "http://narkisr.github.com/couch-fuse/") " for more info."] 
  ] 
 [:div {:class "span4"}
  [:h3 "Gelfino"] 
  [:p "A small embedded logging server which implements " (link "Graylog2" "http://graylog2.org/") " " (link "GELF" "http://www.graylog2.org/about/gelf") 
      " protocol, Gelfino offers a concise DSL for processing log streams and for defining " (link "Drools fusion" "http://www.jboss.org/drools/drools-fusion.html") " " (link "CEP" "http://en.wikipedia.org/wiki/Complex_event_processing") " rules, for more info head on to project's " (link "website" "https://github.com/narkisr/gelfino") " or view this " (link "screencast" "https://vimeo.com/40190962") "."] 
  ]
 [:div {:class "span4"}
  [:h3 "Gradle Liquibase plugin"] 
  [:p "This " (link "Gradle" "http://www.gradle.org/") " plugin offers a complete life cycle management of database schema, it follows the same philosophy as any other source based project by providing development, packaging and deployment phases, it uses the excellent " (link "Liquibase" "http://www.liquibase.org/") " for all the heavy database refactoring functionality, development was sponsored by " (link "Kenshoo" "http://www.kenshoo.com/") " follow "  (link "this" "https://github.com/narkisr/gradle-liquibase-plugin") " for more information." ]
  ]
 ]
