/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Hatching from '../classes/hatching'

/**
 * Class Install
 */
export default class Install extends Command {
   static flags = {
      info: flags.help({ char: 'h' }),
      gui: flags.boolean({ char: 'g', description: 'use Calamares installer (gui)' }),
      mx: flags.boolean({ char: 'm', description: 'try to use MX installer (gui)' }),
      cli: flags.boolean({ char: 'c', description: 'try to use antiX installer (cli)' }),
      umount: flags.boolean({ char: 'u', description: 'umount devices' }),
      lvmremove: flags.boolean({char: 'l',description: 'remove lvm /dev/pve'}),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }
   static description = 'eggs installer - (the egg became penguin)'

   static aliases = ['hatch']

   static examples = [`$ eggs install\nInstall the system with eggs cli installer(default)\n`]

   /**
    * Execute
    */
   async run() {
      Utils.titles('install')

      const { flags } = this.parse(Install)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      let umount = false
      if (flags.umount) {
         umount = true
      }

      let lvmremove = false
      if (flags.lvmremove) {
         lvmremove = true
      }

      if (Utils.isRoot()) {
         if (Utils.isLive()) {
            if (flags.gui) {
               shx.exec('calamares')
            } else if (flags.mx || flags.cli) {
               antiX()
            } else {
               const hatching = new Hatching()
               if (lvmremove) {
                  Utils.warning('Removing lvm')
                  await hatching.lvmRemove(verbose)
                  Utils.titles('install')
               }
               Utils.warning('Installing the system / spawning the egg...')
               await hatching.questions(verbose, umount)
            }
         } else {
            Utils.warning(`You are in an installed system!`)
         }
      }
   }
}


async function antiX() {
   // la root è /live/linux

   // Queste servono a far partire minstall
   // shx.exec('rm /live -rf')
   // shx.exec('mkdir /live/linux/home/demo -p')
   // shx.exec('mkdir /live/aufs/boot -p')
   // shx.exec('mkdir /live/boot-dev/antiX/ -p')
   // shx.exec('ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs')

/*
   /dev/sr0 /live/boot-dev iso9660 ro,relatime,nojoliet,check=s,map=n,blocksize=2048 0 0
   /dev/loop0 /live/linux squashfs ro,relatime 0 0
   tmpfs /live/aufs-ram tmpfs rw,noatime,size=1589248k 0 0
   overlay / overlay rw,relatime,lowerdir=/live/linux,upperdir=/live/aufs-ram/upper,workdir=/live/aufs-ram/work 0 0
   tmpfs /media tmpfs rw,noatime,size=10240k 0 0
   tmpfs /run tmpfs rw,nosuid,nodev,noexec,noatime,size=204268k,mode=755 0 0
   tmpfs /live tmpfs rw,noatime,size=10240k,mode=755 0 0
   tmpfs /tmp tmpfs rw,noatime 0 0
   proc /proc proc rw,nosuid,nodev,noexec,relatime 0 0
   sys /sys sysfs rw,nosuid,nodev,noexec,relatime 0 0
   devtmpfs /dev devtmpfs rw,relatime,size=1015072k,nr_inodes=253768,mode=755 0 0
   devpts /dev/pts devpts rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000 0 0
   overlay /live/aufs overlay rw,relatime,lowerdir=/live/linux,upperdir=/live/aufs-ram/upper,workdir=/live/aufs-ram/work 0 0
   tmpfs /etc/live/config tmpfs rw,noatime,size=10240k,mode=755 0 0
   tmpfs /etc/live/bin tmpfs rw,noatime,size=10240k,mode=755 0 0
   tmpfs /run/lock tmpfs rw,nosuid,nodev,noexec,relatime,size=5120k 0 0
   pstore /sys/fs/pstore pstore rw,relatime 0 0
   tmpfs /dev/shm tmpfs rw,nosuid,nodev,noexec,relatime,size=408520k 0 0
   rpc_pipefs /run/rpc_pipefs rpc_pipefs rw,relatime 0 0
   cgroup /sys/fs/cgroup tmpfs rw,relatime,size=12k,mode=755 0 0
   systemd /sys/fs/cgroup/systemd cgroup rw,nosuid,nodev,noexec,relatime,release_agent=/run/cgmanager/agents/cgm-release-agent.systemd,name=systemd 0 0
   tmpfs /run/user/1000 tmpfs rw,nosuid,nodev,relatime,size=204264k,mode=700,uid=1000,gid=1000 0 0
   gvfsd-fuse /run/user/1000/gvfs fuse.gvfsd-fuse rw,nosuid,nodev,relatime,user_id=1000,group_id=1000 0 0
*/   

showexec('rm /live -rf')
showexec('mkdir /live')
showexec('mkdir /live/aufs-ram -p')
// /dev/sr0 /live/boot-dev iso9660 ro,relatime,nojoliet,check=s,map=n,blocksize=2048 0 0
// /dev/loop0 /live/linux squashfs ro,relatime 0 0
showexec('mkdir /live/linux -p')
showexec('ln -s /usr/lib/live/mount/rootfs/filesystem.squashfs /live/linux')
showexec('mount -t tmpfs -o rw,noatime,size=1589248k tmpfs /live/aufs-ram')
// overlay / overlay rw,relatime,lowerdir=/live/linux,upperdir=/live/aufs-ram/upper,workdir=/live/aufs-ram/work 0 0
showexec('mount -t tmpfs -o rw,noatime,size=10240k tmpfs /media')
// showexec('mount -t tmpfs /run tmpfs rw,nosuid,nodev,noexec,noatime,size=204268k,mode=755') // 0 0
showexec('mount -t tmpfs -o rw,noatime,size=10240k,mode=755 tmpfs /live')
showexec('mkdir /live/aufs')
// showexec('mount -t tmpfs /tmp tmpfs rw,noatime', {silent: false}) // 0 0
// showexec('mount -t proc /proc proc rw,nosuid,nodev,noexec,relatime', {silent: false}) // 0 0
// showexec('mount -t sys /sys sysfs rw,nosuid,nodev,noexec,relatime', {silent: false}) // 0 0
// showexec('mount -t devtmpfs /dev devtmpfs rw,relatime,size=1015072k,nr_inodes=253768,mode=755', {silent: false}) // 0 0
// showexec('mount -t devpts /dev/pts devpts rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000, {silent: false}) // 0 0

showexec('mkdir /live/aufs-ram')
showexec('mkdir /live/aufs-ram/upper')
showexec('mkdir /live/aufs-ram/work')

showexec('mount -t overlay -o lowerdir=/usr/lib/live/mount/rootfs/filesystem.squashfs,upperdir=/live/aufs-ram/upper,workdir=/live/aufs-ram/work  overlay /live/aufs') // 0 0
showexec('mount -t tmpfs -o rw,noatime,size=10240k,mode=755 tmpfs /etc/live/config')
showexec('mount -t tmpfs -o rw,noatime,size=10240k,mode=755 tmpfs /etc/live/bin')
showexec('mount -t tmpfs -o rw,nosuid,nodev,noexec,relatime,size=5120k tmpfs /run/lock')
// showexec('mount -t pstore /sys/fs/pstore pstore rw,relatime') // persistent store
showexec('mount -t tmpfs -o rw,nosuid,nodev,noexec,relatime,size=408520k tmpfs /dev/shm')
// showexec('mount -t rpc_pipefs /run/rpc_pipefs rpc_pipefs rw,relatime') // nfs
// showexec('mount -t cgroup /sys/fs/cgroup tmpfs rw,relatime,size=12k,mode=755') // 0 0
// showexec('mount -t systemd /sys/fs/cgroup/systemd cgroup rw,nosuid,nodev,noexec,relatime,release_agent=/run/cgmanager/agents/cgm-release-agent.systemd,name=systemd') // 0 0
showexec('mount -t tmpfs -o rw,nosuid,nodev,relatime,size=204264k,mode=700,uid=1000,gid=1000 tmpfs /run/user/1000')
// showexec('mount -t gvfsd-fuse /run/user/1000/gvfs fuse.gvfsd-fuse rw,nosuid,nodev,relatime,user_id=1000,group_id=1000') // 0 0


   // monto su linuxfs il filesystem squash
   // showexec('mkdir /live/boot-dev/antiX/linuxfs -p')
   // showexec('ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs')

   // showexec('mkdir /live/linux')
   // showexec('mount -t squashfs /live/boot-dev/antiX/linuxfs /live/linux'))

   // showexec(`mount -t overlay overlay -o lowerdir=/live/linux,upperdir=/run/live/overlay/rw,workdir=/run/live/overlay/work /live/linux`)
   // showexec('ln -s /live/linux/home/live /live/linux/home/demo') 
   
   // showexec('ln -s /run/live/medium /live/boot-dev')
   
   // Fino qua OK minstall parte

   // Creazione delle partizioni di mount
   // showexec('mkdir /mnt/antiX/ -p')
   // showexec('mkdir /mnt/antiX/boot/efi -p')
   // showexec('mount --bind /boot/efi /mnt/antiX/boot/efi ')

   // showexec('mkdir /mnt/antiX/proc -p')
   // showexec('mount --bind /proc /mnt/antiX/proc ')

   // showexec('mkdir /mnt/antiX/sys -p')
   // showexec('mount --bind /sys /mnt/antiX/sys ')

   // showexec('mkdir /mnt/antiX/dev -p')
   // showexec('mount --bind /dev /mnt/antiX/dev ')

   console.log('exportimental!!!')
   console.log('Try to use:')
   console.log('sudo cli-installer')
   console.log('or')
   console.log('sudo minstall')

   // shx.exec('/mnt/antiX/dev/shm -p')
   // shx.exec('/mnt/antiX/home -p')

   //shx.exec('minstall')
}

function showexec (cmd = '') {
   console.log( cmd )
   shx.exec(cmd)
}


