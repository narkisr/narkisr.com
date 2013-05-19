; @title  default title
; @format html5


(defn license [site]
  [:div {:class "span-24 small quite last"}
    [:span {:xmlns:dc "http://purl.org/dc/elements/1.1/" :href "http://purl.org/dc/dcmitype/Text" :property "dc:title" :rel "dc:type"} " This website content"]
    " by " [:a {:xmlns:cc "http://creativecommons.org/ns#" :href site :property "cc:attributionName" :rel "cc:attributionURL"} " Ronen Narkis "]
       " is licensed under a "
       [:a {:rel "license" :href "http://creativecommons.org/licenses/by/2.5/il/"} "Creative Commons Attribution 2.5 Israel License"] ", based on a work at "
       [:a {:xmlns:dc "http://purl.org/dc/elements/1.1/" :href site :rel "dc:source"} "narkisr.com"]", "
       "Permissions beyond the scope of this license may be available at "
       [:a {:xmlns:cc "http://creativecommons.org/ns#" :href site :rel "cc:morePermissions"} "narkisr.com"] "."
       ])

(defn with-root [args site] 
 (map #(str (:root site) %) args) ) 


(defn nav-bar []
  [:div {:class "navbar navbar-fixed-top"}
   [:div {:class "navbar-inner"}
    [:div {:class "container"}
     [:a {:class "btn btn-navbar" :data-toggle "collapse" :data-target ".nav-collapse"}
      [:span {:class "icon-bar"}]
      [:span {:class "icon-bar"}]
      [:span {:class "icon-bar"}] ]
      [:a {:href "/atom.xml" :class "btn" :style "float: right;background: white;"} 
          [:i {:class "icon-rss" }]]
      [:a {:href "http://twitter.com/narkisr" :class "btn" :style "float: right;background: white;"} 
          [:i {:class "icon-twitter" }]]
     [:a {:href "https://github.com/narkisr" :class "btn" :style "float: right;background: white;"} 
          [:i {:class "icon-github-alt" }]]
     [:a {:href "http://il.linkedin.com/in/narkisr/" :class "btn" :style "float: right;background: white;"} 
          [:i {:class "icon-linkedin" }]]
     [:a {:class "brand" :href "/"} "Narkisr.com" ]
     [:div {:class "nav-collapse"}
      [:ul {:class "nav"}
       [:li {:class "divider-vertical"}]
       [:li [:a {:href "/posts.html"} "Posts"]]
       [:li [:a {:href "/projects.html"} "Projects"]]
       [:li [:a {:href "/presentations.html"} "Presentations"]]] 
      ]
     ]]]
  )

(defn analytics []
   [:script {:type "text/javascript"} 
    " var _gaq = _gaq || [];
     _gaq.push(['_setAccount', 'UA-3291642-5']);
     _gaq.push(['_trackPageview']);

    (function() {
      var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
      ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
      var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })(); 
    "
    ] 
    
  )

[:head
 [:meta {:charset (:charset site)}]
 [:meta {:name "viewport" :content "width=device-width, initial-scale=1.0"}]
 (analytics)
 [:title
  (if (= (:title site) "home")
    (:site-title site)
    (str (:site-title site) " - " (:title site)))]

 [:style "body { padding-top: 80px; }"]
 [:link {:rel   "shortcut icon" :href  "/favicon.ico"}]
 [:link {:href  "/atom.xml" :rel   "alternate" :title (:title site) :type  "application/atom-xml"}]
 (css (with-root (site :css) site)) ]

[:body 
 (nav-bar)
 [:div {:class "container"}

  contents

  [:footer {:class "footer"} (license "narkisr.com") ]]

  (js (with-root (site :js) site))]

