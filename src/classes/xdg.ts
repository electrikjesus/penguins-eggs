/**
 * xdg-utils
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import shx = require('shelljs')
import fs = require('fs')
import os = require('os')
import Ovary from './ovary'
import Pacman from './pacman'
import Utils from './utils'

// libraries
const exec = require('../lib/utils').exec

/**
 * Xdg: xdg-user-dirs, etc
 * @remarks all the utilities
 */
export default class Xdg {
    /**
     * 
     * @param user 
     * @param chroot 
     * @param verbose 
     */
    static async create(user: string, chroot: string, verbose = false) {
        let echo = Utils.setEcho(verbose)


        // DESKTOP=Desktop
        let pathPromise = await this.path(user, chroot, 'DESKTOP', verbose)
        Xdg.mk(chroot, pathPromise)

        // DOWNLOAD=Downloads
        pathPromise = await this.path(user, chroot, 'DOWNLOAD', verbose)
        Xdg.mk(chroot, pathPromise)

        // TEMPLATES=Templates
        pathPromise = await this.path(user, chroot, 'TEMPLATES', verbose)
        Xdg.mk(chroot, pathPromise)

        // PUBLICSHARE=Public
        pathPromise = await this.path(user, chroot, 'PUBLICSHARE', verbose)
        Xdg.mk(chroot, pathPromise)

        // DOCUMENTS=Documents
        pathPromise = await this.path(user, chroot, 'DOCUMENTS', verbose)
        Xdg.mk(chroot, pathPromise)

        // MUSIC=Music
        pathPromise = await this.path(user, chroot, 'MUSIC', verbose)
        Xdg.mk(chroot, pathPromise)

        // PICTURES=Pictures
        pathPromise = await this.path(user, chroot, 'PICTURES', verbose)
        Xdg.mk(chroot, pathPromise)

        // VIDEOS=Videos
        pathPromise = await this.path(user, chroot, 'VIDEOS', verbose)
        Xdg.mk(chroot, pathPromise)
    }

    /**
     * 
     * @param chroot 
     * @param pathPromise 
     */
    static async mk(chroot: string, pathPromise: string, verbose = false) {
        let echo = Utils.setEcho(verbose)
        if (verbose) console.log(chroot + pathPromise)
        if (!fs.existsSync(chroot + pathPromise)) {
            await exec(`mkdir ${chroot}${pathPromise}`, echo)
        }
    }
    /**
     * 
     * @param user 
     * @param chroot 
     * @param type 
     * @param verbose 
     */
    static async  path(user: string, chroot = '/', type = 'DESKTOP', verbose = false): Promise<string> {

        const pathPromise = await exec(`chroot ${chroot} sudo -u ${user} xdg-user-dir ${type}`, { echo: verbose, ignore: false, capture: true })
        const pathTo = pathPromise.data.trim() // /home/live/Scrivania
        return pathTo
    }

    /**
     * 
     * @param olduser 
     * @param newuser 
     * @param chroot 
     */
    static async autologin(olduser: string, newuser: string, chroot = '/') {
        if (Pacman.packageIsInstalled('lightdm')) {
            shx.sed('-i', `autologin-user=${olduser}`, `autologin-user=${newuser}`, `${chroot}/etc/lightdm/lightdm.conf`)
        }
    }

    /**
     * Copia della cofiguirazione in /etc/skel
     * @param user 
     * @param verbose 
     */
    static async skel(user: string, verbose = false) {
        let echo = Utils.setEcho(verbose)

        if (verbose) {
            console.log('preparing /etc/skel\n')
        }

        const ovary = new Ovary
        await ovary.fertilization()

        /**
         * Salva la vecchia skel in skel_data_ora.backup
         */
        await exec(`mv /etc/skel ${ovary.snapshot_dir}skel_${Utils.formatDate(new Date())}.backup`, echo)

        // Crea nuova skel 
        await exec(`mkdir -p /etc/skel`, echo)

        // echo $XDG_CURRENT_DESKTOP
        let files = [
            '.bashrc',
            '.config',
            '.local',
            '.profile',
        ]

        // Aggiungo la configurazione del DM usato
        if (Pacman.packageIsInstalled('cinnamon-core')) {
            files.push('.cinnamon')
        }
        if (Pacman.packageIsInstalled('lxde-core')) {
            // files.push('.lxde')
        }
        if (Pacman.packageIsInstalled('lxqt-core')) {
            // files.push('.lxqt')
        }

        // Copio da user tutti i files
        for (let i in files) {
            if (fs.existsSync(`/home/${user}/${files[i]}`)) {
                await exec(`cp -r /home/${user}/${files[i]} /etc/skel/ `, echo)
            }
        }

        // Eseguo la pulizia dei dati personali in skel

        // .config
        await this.deleteIfExist(`/etc/skel/.config/user-dirs.*`, verbose)

        // .local
        await this.deleteIfExist(`/etc/skel/.local/share/Trash`, verbose)
        await this.deleteIfExist(`/etc/skel/.local/share/gvfs-metadata`, verbose)
        await this.deleteIfExist(`/etc/skel/.local/gvfs-metadata`, verbose)
        await this.deleteIfExist(`/etc/skel/.local/share/keyrings/login.keyring`, verbose)
        await this.deleteIfExist(`/etc/skel/.local/share/keyrings/user.keystore`, verbose)

        await exec(`chown root:root /etc/skel -R`, echo)

        // Utile per prove
        // await exec(`rm -r /home/pippo1`, echo)
        // await exec(`cp -r /etc/skel /home/pippo1 `, echo)
        // await exec(`chown pippo1:pippo1 /home/pippo1 -R`, echo)
    }

    /**
     * 
     * @param file 
     */
    static async deleteIfExist(file: string, verbose = false) {
        let echo = Utils.setEcho(verbose)

        if (verbose) console.log(`testing: ${file}`)
        if (fs.existsSync(file)) {
            await exec(`rm -rf ${file}`, echo)
        }
    }

    /**
     * 
     * @param cmd 
     * @param verbose 
     */
    static async showAndExec(cmd: string, verbose = false) {
        let echo = Utils.setEcho(verbose)
    
        if (verbose) console.log(cmd)
        await exec(cmd, echo)
    }
}




/**
# remastersys-skelcopy script to copy user data to /etc/skel
#  https://raw.githubusercontent.com/mutse/remastersys/master/remastersys/src/remastersys-skelcopy
#
#
#  Created by Tony "Fragadelic" Brijeski
#
#  Copyright 2011,2012 Under the GNU GPL2 License
#
#  Created November 23, 2011
#
*/

        // .gconf
        // await this.deleteIfExist(`/etc/skel/.gconf/system/networking`, verbose)

        /*
        await this.deleteIfExist(`/etc/skel/.config/chromium`, verbose)
        await this.deleteIfExist(`/etc/skel/.config/midori/cookies.*`, verbose)
        await this.deleteIfExist(`/etc/skel/.config/midori/history.*`, verbose)
        await this.deleteIfExist(`/etc/skel/.config/midori/tabtrash.*`, verbose)
        await this.deleteIfExist(`/etc/skel/.config/midori/running*`, verbose)
        await this.deleteIfExist(`/etc/skel/.config/midori/bookmarks.*`, verbose)
        */

        /*
        await this.deleteIfExist(`/etc/skel/.local/share/applications/wine-*`, verbose)
        await this.deleteIfExist(`/etc/skel/.local/share/akonadi`, verbose)
        await this.deleteIfExist(`/etc/skel/.local/share/webkit`, verbose)
        await this.deleteIfExist(`/etc/skel/.local/share/webkit`, verbose)

        // kde
        await this.deleteIfExist(`/etc/skel/.kde/share/apps/klipper`, verbose)
        await this.deleteIfExist(`/etc/skel/.kde/share/apps/nepomuk`, verbose)
        await this.deleteIfExist(`/etc/skel/.kde/share/apps/RecentDocuments/*`, verbose)

        // others
        let cmd = `for i in /etc/skel/.gnome2/keyrings/*; do rm ${user}; done`
        cmd = `find /etc/skel/.gnome2/keyrings/ | grep "${user}" | xargs rm -rf '{}'`
        await this.showAndExec(cmd, verbose)

        cmd = `find /etc/skel/ | grep "${user}" | xargs rm -rf '{}'`
        await this.showAndExec(cmd, verbose)

        cmd = `find /etc/skel/ -name "*socket*" | xargs rm -rf '{}'`
        await this.showAndExec(cmd, verbose)

        cmd = `find /etc/skel/ -name "*cache*" | xargs rm -rf '{}'`
        await this.showAndExec(cmd, verbose)

        cmd = `grep -Rl "${user}" /etc/skel | xargs rm -rf '{}'`
        await this.showAndExec(cmd, verbose)
        */
