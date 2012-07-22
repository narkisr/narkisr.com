(ns active
 (:use [jayq.core :only [$ css inner]]))

(defn ^:export activate [d]
  (->  ($ (keyword d)) (css {:background "blue"})  )) 

