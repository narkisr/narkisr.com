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
      [:span {:class "icon-bar"}]
      ]
     [:a {:href "/atom.xml"} 
             [:img {:style "border-width:0;margin: 5px 0 0 0;float: right" :src "/img/rss.png"}]]
     [:a {:class "brand" :href "/"} "Narkisr.com" ]
     [:div {:class "nav-collapse"}
      [:ul {:class "nav"}
       [:li {:class "divider-vertical"}]
       [:li [:a {:href "/posts.html"} "Posts"]]
       [:li [:a {:href "/projects.html"} "Projects"]]]
      ]
     ]]]
  )

[:head
 [:meta {:charset (:charset site)}]
 [:meta {:name "viewport" :content "width=device-width, initial-scale=1.0"}]

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

