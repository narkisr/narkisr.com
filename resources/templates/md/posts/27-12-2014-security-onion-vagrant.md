{:title "Security onion vagrant"
 :layout :post
 :tags  ["vagrant" "opskeleton" "security"]
 :toc false}

### Intro
Setting up [IDS](http://en.wikipedia.org/wiki/Intrusion_detection_system) systems such as [snort](https://www.snort.org/) has always been a tedious task, [Security onion](http://blog.securityonion.net/p/securityonion.html) (or SO for short) is a solution that aims to change that.

It includes not only snort but also [ossec](http://www.ossec.net/) (a HIDS system), [ELSA](https://code.google.com/p/enterprise-log-search-and-archive/) for central logging management, [Snorby](https://www.snorby.org/) a dashboard for IDS events. 

SO publishes a [PPA](https://launchpad.net/~securityonion/+archive/ubuntu/stable) which is Ubuntu 12.04 compatible and distributes a livecd [ISO](http://sourceforge.net/projects/security-onion/) for setting it up on physical machines.

In this post ill go through on how to setup SO vagrant box, enabling us to do fast iterations and provisioning development.

#### BOX setup

The first step is creating the SO box itself using [packer](https://www.packer.io/):

```bash
$ git clone git://github.com/narkisr/packer-security-onion.git 
# won't work on a headless machine
$ make virtualbox/security-onion-12.04.4  
```

The box itself is quite heavily customized due to the requirements of SO, once the box was created we import it like any other:

```bash
$ vagrant box add security-onion-12.04.4_puppet-3.7.3 box/virtualbox/security-onion-12.04.4_puppet_3.7.3.box
```

Now we are ready to start rolling vagrant.


#### Vagrant

Perquisites:
* [Opskeleton](https://github.com/opskeleton/opskeleton) defines the project layout of the following Vagrant/Puppet code base so make sure to [have](https://github.com/opskeleton/opskeleton#installation).
* SO itself requires a running GUI (so no headless servers).
* Have a mirror port ready on your switch connected to a physical interface (if you want to capture meaningful traffic), note that you can customize the mirror port vagrant uses (using VAGRANT_MIRROR).

```bash
$ git clone git://github.com/opskeleton/security-onion-sandbox.git
# Wont work on a headless machine
$ gem install bundle
$ bundle install
$ librarian-puppet install
# in order to customize mirror port use VAGRANT_MIRROR=ifc
$ vagrant up
```

Once the VM UI is running enter a terminal and start sosetup:

```bash
$ sosetup
```

On its first invocation the wizard will guide you through the network setup, choose eth0 as the management interface and eth1 as the monitor interface, reboot once done.

Once the machine is up run sosetup again to setup Sguil and Snorby u/p

```bash
$ sosetup
```

Once done you can either head on to [localhost](https://localhost) (from within the VM) or from the host use the forwarded ports [snorby](https://localhost:8444).

#### Footnotes:

<small> Sadly automating the setup wizard using Puppet didn't workout, you can pass an answer file but the text based wizard does not work proprerly while being ran from the Puppet exec call. </small>
<small> ssh didn't work well 
