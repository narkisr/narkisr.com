; @title  default title
; @format html5


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
     [:a {:class "brand" :href "#"} "Narkisr.com" ]
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
 [:div {"class" "container"}
  contents
  [:footer {:class "footer"} 
   [:p
    (link (str "@" (:twitter site)) (str "http://twitter.com/" (:twitter site))) "&nbsp; 2012"]]]
 (js (with-root (site :js) site))]


