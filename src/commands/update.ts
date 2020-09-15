/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'

export default class Update extends Command {
   static description = "update/upgrade the penguin's eggs tool.\nThis way of update work only with npm installation, if you used the debian package version, please download the new one and install it."

   static examples = [
      `$ eggs update
update/upgrade the penguin's eggs tool
`
   ]

   async run() {
      Utils.titles('update')

      if (Utils.isRoot()) {
         if (await Utils.customConfirm(`Select yes to continue...`)) {
            Utils.warning('Updating eggs...')
            if (Pacman.isSources()) {
               Utils.warning('You are using eggs from sources')
               console.log('You can upgrade getting a new version from git:')
               console.log('cd ~/penguins-eggs')
               console.log('git pull')
               console.log('')
               console.log('You can also create a fresh installation on your hone:')
               console.log('cd ~')
               console.log('git clone https://github.com/pieroproietti/penguins-eggs')
               console.log('')
               console.log('Before to use eggs, remember to install npm packages:')
               console.log('cd ~/penguins-eggs')
               console.log('npm install')
            } else if (Pacman.isDebPackage()) {
               Utils.warning('You have eggs installed a package .deb')
               console.log('If you have eggs in yours repositories apt:')
               console.log('sudo apt update')
               console.log('sudo apt upgrade eggs')
               console.log('')
               console.log('Else, download package from https://sourceforge.net/projects/penguins-eggs/files/packages-deb/')
               console.log('and install it with:')
               console.log('sudo dpkg -i eggs_7.6.x-x_xxxxx.deb')
            } else {
               console.log(`updating ${Utils.getPackageName()} version ${Utils.getPackageVersion()}`)
               shx.exec(`npm update ${Utils.getPackageName()} -g`)
            }
         }
      }
   }
}
