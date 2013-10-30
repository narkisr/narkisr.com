; @title  default title
; @format html5
; @layout  default
 
[:div {:class "page-header"}
  [:h1 "Public presentations"]]

[:p "The following list most of the presentations I gave in public forums, all the presentations are viewable in your browser (no need for bloatware). "
     "Iv used " (link "showoff" "https://github.com/narkisr/showoff") " for the earlier presentations and " (link "impress.js" "https://github.com/bartaz/impress.js") 
     " for later ones, the source (markup) is available under my " (link "Github" "https://github.com/narkisr") " account." ]


[:div {:class "row"}
 [:div {:class "span4"}
  [:h3 "Jenkins scalling"] 
  [:p  "A talk about scaling Jenkins and build infrastructure from single instance to multiple distributed slaves while keeping high level of performance, responsiveness and agility."] 
  [:p "This talk was presented at " (link "juc" "http://www.cloudbees.com/jenkins-user-conference-2012-israel.cb") " and made available " (link "here" "http://narkisr.github.com/jenkins-scaling/#title") "."]
  ] 
 [:div {:class "span4"}
  [:h3 "Gelfino intro"] 
  [:p  "This talk introduces " (link "gelfino" "https://github.com/narkisr/gelfino") 
   " and its drools fusion integration (see " (link "projects page" "/projects.html") ") it can be viewed " (link "online" "http://narkisr.github.com/gelfino-intro/#title") "." ]
   [:p "This lightning talk was presented at " (link "The edge 2012" "http://www.javaedge.com/lightingtalk.jsp")] 
  ]
 [:div {:class "span4"}
  [:h3 "Clojure introduction"] 
  [:p  "An introduction of Clojure core features like first class functions, macros, namespaces, data structures "  "." ]
  [:p "Main abstractions like sequences protocols and types, Clojure concurrency primitives and STM."]
  [:p "Presented as an " (link "ILtech talk" "http://www.iltt.org.il/home/talks")  " and accessible " (link "online" "http://narkisr.github.com/clojure-intro/#overview") "."]
  ]]

[:div {:class "row"}
 [:div {:class "span4"}
  [:h3 "Clojure concurrency"] 
  [:p  "This talk covers Clojure concurrency primitives, STM and underlying implementation source code, the presentation was recorded and can be viewed online (" (link "part 1" "http://www.youtube.com/watch?v=F7TeqdSC2ts&feature=plcp") 
   " and " (link "part 2" "http://www.youtube.com/watch?v=amiicoyXxGI&feature=plcp") ") the slides are available " (link "here" "http://narkisr.github.com/clojure-concurrency/#1") "."] 
  [:p "It was presented at " (link "Haifa Uni" "http://www.haifa.ac.il/") " Functional programming on the JVM course."]] 

 [:div {:class "span4"}
  [:h3 "Lambda Groovy"] 
  [:p "A " (link "Sayeret Lambda" "http://www.meetup.com/saylambda/events/28807051/") " talk which covers Groovy GDK, Builders, MOP, AST transformation and Gpars, view it " (link "online" "http://narkisr.github.com/lambda-groovy/#1") "." ]]
 [:div {:class "span4"}
  [:h3 "Java on steroids"] 
  [:p "This talk covers dynamic languages on the JVM, main benefits, fast development cycle, meta object protocol, domain specific languages and interesting projects in Groovy and Ruby available " 
   (link "here" "http://bit.ly/NBBZFG") "." ]
  [:p "This talk was presented at JavaEdge 2007."]
  ]
 ]
[:div {:class "row"}
 [:div {:class "span4"}
  [:h3 "Vagrant sketching board"] 
  [:p  "This talk introduces Vagrant basic workflow and deep dives into how Vagrant can be used to develop distributed systems locally, " (link "Opskeleton" "https://github.com/narkisr/opskeleton") " is also covered as a solution for bootstrapping Vagrant based projects and distributing them."
   " the talk was recorded and can be viewed " (link "online" "https://www.youtube.com/watch?v=R8CD97SE6Eg") " the slides are available " (link "here" "http://narkisr.github.io/vagrant-sketching-board/index.html#/") "."] 
  [:p "It was presented at:"
   [:ul
    [:li (link "Devopscon" "http://devopscon.com/wordpress/presentation/vagrant-and-puppet-your-ops-sketching-board/") " 2013 (renamed to devopdays)."]
    [:li (link "Reversim" "http://summit2013.reversim.com/#/sessions/Vagrant%20and%20Puppet,%20your%20ops%20sketching%20board") " summit 2013"] 
    ]]] 

 [:div {:class "span4"}
  [:h3 "Clojure for bigdata processing"] 
  [:p "This talks covers the use of Clojure in big data processing settings, how it can simplify and enhance Hadoop, its EMR integration, performance the testing libraries and declarative batch processing using " (link "Cascalog" "https://github.com/nathanmarz/cascalog") " the slides are available " (link "here" "http://narkisr.github.io/clojure-bigdata-processing/index.html#/")"."]
  [:p "This talk was presented at " (link "devcon 2013" "http://devcon-february.events.co.il/presentations/708-clojure-for-big-data-processing")]
  ]

 ]
[:p "* The license for all presentations is " (link "Creative Commons Attribution 3.0 Unported License" "http://creativecommons.org/licenses/by/3.0/") " unless stated differently."  ]
