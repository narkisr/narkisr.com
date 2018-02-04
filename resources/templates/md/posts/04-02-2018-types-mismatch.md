{:title "When types are eating away your sanity"
 :layout :post
 :tags  ["impedance" "types" "software" "design"]
 :toc false}

### Intro
Iv been programming in Java for more than 15 years and in every project I kept seeing the same pattern:

```java
public class PersonTo {
  public String name;
  public Integer age;
}

public class PersonModel {
  public String name;
  public Integer age;
  public boolean isRegistered;
}

public class ServiceA {

  public void personsService(String json){
   PersonTo person = parse(json);
   PersonModel model = process(person);
   persist(model);
  }
}

```

If you lucky you have a set of conversion logic in place (iv seen a lot of duplicated code that ignores the issue and just copy and past the same logic):


```java
public class PersonToConvertor<PersonModel> {
   public PersonModel convert(PersonTo person) {
    //.. the pleasure of conversion logic
    return personModel;
   }
}
public class PersonModelConvertor<PersonTo> {
   public PersonTo convert(PersonModel person) {
    //.. the pleasure of conversion logic
    return personTo;
   }
}
```

We have a simple json -> PersonTo -> PersonModel conversion chain, why we have those conversions? because each part of the system expect to get the data in a certain shape and form and because its better OOP modeling.

Still this is a simple example and you can imagine the piles and piles of code that deals with this issue, it does not matter if your programming in Java/Haskell/Go/Elm at the end of the day slurping data into your system will cost you.

Not only that but if the data types/structure changes you may find yourself in a huge refactoring and moving/shaking a lot of types/methods/functions around (a ripple effect).

But wait, is there an alternative?

### Bringing back sanity

As a matter of a fact there is, almost any functional dynamic language does not require such wacky conversions, we can just work on the raw data:

```clojure
(defn service-a [json]
    (-> json parse process persist))

; once parsed the person is a simple hashmap datastructure that we manipulate
(defn process [person]
   (assoc person :is-registered false))
```

Oh wait, that is too simple your cheating!, what about type checking your code? making sure that its correct and all.


In the words of Rich Hickey:

>And I like to ask this question: What's true of every bug found in the field?

>Audience reply: Someone wrote it? Audience reply: It got written.

>It got written. Yes. What's a more interesting fact about it? It passed the type checker.

With all that in mind there are cases where checking structure the data between components make sense.

Enter clojure.spec:

```clojure
(s/def ::name string?)
(s/def ::age integer?)

(s/def ::person (s/keys :req [::name ::age]
```

This allows us to check the validity in run time and check that different parts of the system conform to the specifications of others.

### We have magic X that converts our types!

There are "shorter" ways of converting types, such as:

1. Code generation, we generate our types and convertors we don't write them manually, the business isn't generated and its bound to those multiple types increasing the maintenance cost, in addition you maintain a whole set of tools and schema so its not free.

2. Automated mapping libraries, similar to code generation you still have to maintain a huge set mapping between the types also the types themself don't go away you still have multiple types describing the same entity.

3. We work on the raw parsed data matching on the JSON:

```scala
class CC[T] {
  def unapply(a:Option[Any]):Option[T] = if (a.isEmpty) {
    None
  } else {
    Some(a.get.asInstanceOf[T])
  }
}

object M extends CC[Map[String, Any]]
object L extends CC[List[Any]]
object S extends CC[String]
object D extends CC[Double]
object B extends CC[Boolean]

for {
  M(map) <- List(JSON.parseFull(jsonString))
  L(languages) = map.get("languages")
  language <- languages
  M(lang) = Some(language)
  S(name) = lang.get("name")
  B(active) = lang.get("is_active")
  D(completeness) = lang.get("completeness")
} yield {
  (name, active, completeness)
}
```

Imagine this logic for n JSON documents in your system, it gets ugly pretty quickly.

## Summary

When using types in the context of unstructured data be aware to the trade-offs, if your system deals with a huge variety of JSON/CSV or random HTML you will be spending a lot time in type conversion juggling not with the business logic itself.

Its hard to quantify but ~30% is not an exaggerated number from my experience in large Java projects, other languages with better type systems might get away with less but it still a considerable overhead.

#### Footnotes:

* <small>[Simple Made easy](https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/SimpleMadeEasy.md).</small>
* <small>[Dozer](http://dozer.sourceforge.net/) is an example for an "automated" bean to bean mapping framework.</small>
* <small> How to parse JSON in [Scala](https://stackoverflow.com/questions/4170949/how-to-parse-json-in-scala-using-standard-scala-classes) using standard Scala classes?</small>


