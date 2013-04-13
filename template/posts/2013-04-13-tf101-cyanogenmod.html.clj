; @layout  post
; @title   Asus TF101 Cyanogenmod
; @tag     android linux root cyanogenmod clockworkmod



[:h3 "Intro"]
[:p "In this post ill try to cover in detail how to root your " (link "Asus TF101" "") " device.  Some of the difficuly in rooting android devices is lack of clear undestanding of the process combbined with lack of proper documentation, I hope to clear a bit of the myst in this post."]   

[:p [:h5 "DISCLAIMER, I take no responsility if you brick you device or any other damage that this might inflict on your device, proceed at your own peril!"]]

[:h4 "Scheme"]
[:p "A root session is composed from 4 steps:" 
[:ul 
 [:li "Rooting your device (basicly enabling root user access to underlying Linux system)."] 
 [:li "Install " (link "ClockworkMod Recovery" "http://forum.xda-developers.com/wiki/ClockworkMod_Recovery") " which is a recovery tool installed on the device, this enables unpacking of custom Android distributions on your device (like " (link "cyanogenmod" "http://www.cyanogenmod.org/") ")."]
 [:li "Booting into CWM and installing a custom ROM from a predownloaded zip file."] 
 [:li "Instaling Google aps from a pre download zip file (the reason this is required is because Google forbided the bundling of its closed source product with the custom ROM)."] 
 ]] 

[:p "Lets begin with rooting the device, we will follow " (link "this" "http://setupguides.blogspot.co.il/2013/01/easily-root-asus-tf101-transformer.html") " method, first we will install adb and fastboot (both are android tools for interacting with the device) as described " (link "here" "http://www.webupd8.org/2012/08/install-adb-and-fastboot-android-tools.html") ":" ]

[:div 
#-BASH
$ sudo add-apt-repository ppa:nilarimogard/webupd8
$ sudo apt-get update
$ sudo apt-get install android-tools-adb android-tools-fastboot
BASH 
 ]

[:p "Now enable usb debbuging in your device and connect it to your pc, it should be detected by adb:"]

[:div 
 #-BASH
$ adb devices                                                                  
 List of devices attached 
 xxxxxxxxxxxxxxx device
 BASH ]

[:p "Now we will download TF101_Root.zip which includes a script and blob file that will uploaded via adb "]

[:div 
#-BASH
$ wget http://ubuntuone.com/5xwKVscUxwgdnudw589ERd -O TF101_Root.zip
$ unzip TF101_Root.zip
# Now I follow root_tf101.sh
$ adb push recoveryblob /sdcard/
$ adb shell mv /data/local/tmp /data/local/tmp.bak
$ adb shell ln -s /dev/block/mmcblk0p4 /data/local/tmp
$ adb reboot 
# wait to device to boot before proceeding
$ adb shell dd if=/sdcard/recoveryblob of=/dev/block/mmcblk0p4
$ adb shell exit
$ adb reboot 
# wait to device to boot before proceeding
$ adb push Superuser-3.0.7-efghi-signed.zip /sdcard/
$ adb reboot 
BASH ]

[:p "Now at the last boot follow the script maunal steps:"
 [:blockquote
   "Shut down the Transformer manually and boot into recovery. To boot into recovery hold Power + Volume Down buttons and next confirm with Volume Up button when asked. Rogue XM recovery will boot."  
   "Select the option to wipe cache, wipe Dalvik cache, then choose Install zip file from internal storage and choose the Superuser-3.0.7-efghi-signed.zip."
  ]
 "Congrates you have root access now."
 ]

[:p "Now lets head on to installing CWM, from your device download " (link "cwm-6.0.2.1-notouch-hybrid.zip" "http://goo.im/devs/RaymanFX/downloads/ClockWordMod-Recovery/TF101/cwm-6.0.2.1-notouch-hybrid.zip") " as referenced from this forum " (link "entry" "http://forum.xda-developers.com/showthread.php?t=1855686") 
 ", reboot into recovery mode (same as before) and apply the zip, reboot again and use the volume-up and power button to enter into CWM recovery."]


[:p "Once you see the CWM recovery loading and working we can proceed with installing the unofficial cyanogenmod as reviewed " (link "here" "http://forum.xda-developers.com/showthread.php?t=2010903") ", from within your device browser download " (link "v0.8.0.zip" "http://goo.im/getmd5/devs/RaymanFX/downloads/CyanogenMod-10.1/TF101/v0.8.0.zip") " and Google apps " (link "4.2_gapps-jb-20121119.zip" "http://goo.im/devs/RaymanFX/downloads/Gapps/4.2_gapps-jb-20121119.zip") ", now boot into CWM and apply the v0.8.0.zip from internal sdcard, also clear the device and dalvik caches reboot into the new Android OS."]

[:p "Note that it will be missing Google apps but we still need to boot into the new OS before applying the second Google apps zip, now its safe to boot into CWM and apply the 4.2_gapps-jb-20121119.zip, one last reboot and you should be greated with Google acount setup dialog."]
