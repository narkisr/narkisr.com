{:title "Raspberry foo"
 :layout :post
 :tags  ["raspberry-pi" "linux" "wifi"]
 :toc true}

Iv been lucky to get my hands on a raspberry pie, from the get go it was clear that this device isn't ready for the faint hearted, while there is abundant content around for how to start going the pi is a moving target and things change quickly, this post is a quick start for getting pie going. 

##### In this post will cover 
* Downloading sdcard image and \"dd'ing\" 
* Enabling SSH and updating Pi's frimware.
* Enabling wifi with the 8192cu chipset:p

##### Downloading and dding
The pi site offers both Arch and Debian  [images](http://www.raspberrypi.org/downloads)
, iv went ahead with Debian mainly since its closer to Ubuntu, note that there are  [beta] (http://rpi-developers.com/frs/download.php/file/20)  " versions out there but iv found the stock one working best.".


```bash
 $ sudo dd bs=1M if=debian6-19-04-2012.img of=/dev/sdb
```

When its done push the sdcard into its slot, make sure to connect the screen before powering up (iv had issue with connecting DVI cable once it was running),  
as the boot is done connect it to the internet and run all the updates (note sudo password is raspberry by default, change it afterwards).

```bash 
$ sudo aptitude update
$ sudo aptitude upgrade
```


##### SSHing
Its time to get our monitor back, we will enable SSH so we can work remotely:  


```bash
# boot enable
$ sudo update-rc.d ssh

# ssh won't start without this
$ ssh-keygem -b 1024 -t rsa -f /etc/ssh/ssh_host_key 
$ ssh-keygen -b 1024 -t rsa -f /etc/ssh/ssh_host_rsa_key 
$ ssh-keygen -b 1024 -t rsa -f /etc/ssh/ssh_host_dsa_key 

# enable firewall
$ sudo aptitude install ufw
$ sudo ufw allow 22 
```

Now will update Pi's frimware:
```bash
# updating frimware
$ sudo wget --no-check-certificate http://goo.gl/1BOfJ -O /usr/bin/rpi-update 
$ sudo chmod +x /usr/bin/rpi-update
$ sudo apt-get install git-core
# avoiding http://tinyurl.com/cbauu4w  
$ sudo ldconfig
$ sudo rpi-update  
```

##### Wifi 
The hardest part in setting up the pi is enabling wireless, this boils down to two main reasons, power consumption and driver compatibility (kernel version wise). 
The pi is powered by a 5v power supply (usb phone charger), this means that it has little power to spare for devices connected to its usb ports, high power long range wifi dongle require too much juice. 

Among the low bandwidth cost adapters that iv found the  [EW-7811UN](http://www.amazon.co.uk/Edimax-EW-7811UN-Wireless-802-11b-150Mbps/dp/B003MTTJOY)  draws very little power, in addition it has a very low profile making it barely visible on the pi board, now comes the fun part of making it work.

The info of how setting it up is scattered and inconsistent, the best source out there for setting it up is this forum  [post](http://www.raspberrypi.org/phpBB3/viewtopic.php?t=6256) 
 by MrEngman , the post provides a  [shell script](http://dl.dropbox.com/u/80256631/install-rtl8188cus.sh)  and  [instructions]( http://dl.dropbox.com/u/80256631/install-rtl8188cus.txt)  on how to use it, 
under compatibility section you can see which driver version matches a kernel version

```bash
$ uname -a 
Linux raspberrypi 3.1.9+ #171 PREEMPT Tue Jul 17 01:08:22 BST 2012 armv6l GNU/Linux

# The matching driver version 
rtl8188cus driver versions and compatible Linux versions
-------------------------------------------------------- 

Driver tar file: 8192cu-20120701.tar.gz (http://dl.dropbox.com/u/80256631/8192cu-20120701.tar.gz)
For kernel versions:

Linux raspberrypi 3.1.9+ #171 PREEMPT Tue Jul 17 01:08:22 BST 2012 armv6l GNU/Linux 
```

Run the installation script:

```bash
$ sudo ./install-rtl8188cus.sh  
```


Lets inspect the results:

```bash

# the 8192cu driver is in place
$ sudo ls /lib/modules/3.1.9+/kernel/net/wireless
8192cu.ko  cfg80211.ko	lib80211.ko  lib80211_crypt_ccmp.ko  lib80211_crypt_tkip.ko  lib80211_crypt_wep.ko

$ sudo cat /etc/network/interfaces | grep wlan0 -A 5 
allow-hotplug wlan0

auto wlan0

iface wlan0 inet dhcp
wpa-ssid "ssid"
wpa-psk "pass"

$ ifconfig | grep wlan
wlan0     Link encap:Ethernet  HWaddr 00:1f:1f:f2:ff:f8
```

Enjoy your pie!  
