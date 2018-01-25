{:title "The balancing game"
 :layout :post
 :tags  ["dependencies" "management" "software" "design"]
 :toc false}

### Intro
Dependencies exists in multiple shapes and forms in our software, some are easy to detect while other are hidden and insidious.

Common to all dependencies is that they have a great effect on the systems we create, in this short post ill try to make you aware on why its crucial to manage them properly and the damage that poor management can cause.

### Where can we find them?

* In External libraries our code depend upon.
* Services that our systems use (Databases, external API's etc..).
* Operating system, packages its running, its kernel version etc..
* The hardware we deploy on, the network setup.
* People we depends upon like developers, clients, investors and of course users.

There are many other places that dependencies creep from just stop and think about it for a second.

### Good or bad?

Like most things in life it depends (pun intended), any dependency can turn into a liability in the future.

It can make your code harder to change, make OS upgrade harder or cause security issues, that said using the right dependency course reduce the amount of work you need to do increase reuse and security.

Managing dependencies is a balancing game and a delicate one at that, it takes experience and trial and error to learn which dependencies are good and which we better avoid.

### Do's and Don'ts

* Map the dependencies you have and track them under an [SCM](https://git-scm.com/).
* Use dependency managers to manage them (create them if none exists).
* Trim dependencies once in a while, they tend to accumulate and grow like a wild plant.
* Keep dependencies up to date, postponing updates for too long can cause your system to stagnate (there are tools that track out of date dependencies).
* Minimize dependency just for a single feature/method/api, sometimes its better to copy and paste a function (assuming its self isolated).
* Don't over minimize and re-invent stuff if it exists already [NIH](https://en.wikipedia.org/wiki/Not_invented_here).

## Summary

Dependencies can really change the faith of a projects (and companies) once a dependency has set in it may be really hard to detach, be cautious and aware to both the challenge and reward that your dependencies present.

#### Footnotes:

* <small>[Lein Ancient](https://github.com/xsc/lein-ancient) and [Gradle Versions](https://github.com/ben-manes/gradle-versions-plugin) are tools to track and report old dependencies.</small>
* <small> [Gradle](https://gradle.org/), [Lein](https://leiningen.org/), [Bundler](http://bundler.io/), [Pipefile](https://github.com/pypa/pipfile) are good examples of code dependency management tools.</small>
* <small> [Apt](https://wiki.debian.org/Apt), [DNF](https://fedoraproject.org/wiki/DNF?rd=Dnf) and [Chocolatey](https://chocolatey.org/) manage packages on a variety of OSes.</small>
* <small> Configuration management tools such as [Puppet](https://puppet.com/) and [Chef](https://www.chef.io/solutions/infrastructure-automation/) manage dependencies of deployed components.<small>


