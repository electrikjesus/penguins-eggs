/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import Bleach from '../classes/bleach'
import { IInstall } from '../interfaces'
import chalk = require('chalk')
import fs = require('fs')
import path = require('path')

const exec = require('../lib/utils').exec

/**
 * 
 */
export default class Config extends Command {
   static description = 'Configure eggs and install packages prerequisites to run it'

   static aliases = ['prerequisites']
   static flags = {
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' }),
   }

   static examples = [`~$ sudo eggs config\nConfigure eggs and install prerequisites`]

   async run() {
      Utils.titles(this.id + ' ' + this.argv)

      const { flags } = this.parse(Config)

      const verbose = flags.verbose

      if (Utils.isRoot(this.id)) {

         // Aggiungere autocomplete
         if (!Utils.isDebPackage()) {
            if (process.arch !== 'ia32') {
               await exec(`cp ${__dirname}/../../scripts/eggs.bash /etc/bash_completion.d/`)
            }
         }

         await Pacman.manPageInstall(verbose)
         
         if (!Pacman.configurationCheck()) {
            await Pacman.configurationInstall()
         }
         // crea i link in /usr/lib/penguins-eggs/conf/distros
         const i = await Config.thatWeNeed(verbose)
         if (i.needApt || i.configuration || i.distroTemplate) {
            if (await Utils.customConfirm(`Select yes to continue...`)) {
               console.log('installing prerequisites...')
               await Config.install(i, verbose)
            }
         } else {
            console.log('config: all is OK, nothing to do!')
         }
      }
   }


   /**
    * 
    * @param links
    * @param verbose 
    */
   static async thatWeNeed(verbose = false): Promise<IInstall> {
      const i = {} as IInstall

      i.distroTemplate = !Pacman.distroTemplateCheck()

      if (process.arch === 'x64') {
         i.efi = (!Pacman.packageIsInstalled('grub-efi-amd64'))
      }

      if (! await Pacman.calamaresCheck() && (await Pacman.isXInstalled())) {
         Utils.warning('You are on a graphics system, I suggest to use the GUI installer calamares')
         i.calamares = (await Utils.customConfirm('Want to install calamares?'))
         console.log()
      }

      i.configuration = !Pacman.configurationCheck()

      i.prerequisites = !await Pacman.prerequisitesCheck()

      if (i.efi || i.calamares || i.prerequisites) {
         i.needApt = true
      }

      if (i.needApt || i.configuration || i.distroTemplate) {
         Utils.warning(`Eggs will execute the following tasks:`)

         if (i.needApt) {
            console.log('- update the system')
            console.log(chalk.yellow('  apt update --yes\n'))
         }

         if (i.efi) {
            console.log('- install efi packages')
            console.log(chalk.yellow('  apt install -y grub-efi-amd64\n'))
         }

         if (i.prerequisites) {
            console.log('- install prerequisites')
            console.log(chalk.yellow('  apt install --yes ' + Pacman.debs2line(Pacman.debs4notRemove)))

            const packages = Pacman.packages(verbose)
            console.log(chalk.yellow('  apt install --yes ' + Pacman.debs2line(packages)))

            if (i.configuration) {
               Utils.warning('creating configuration\'s files...')
               Pacman.configurationInstall(verbose)
            }

            if (i.distroTemplate) {
               console.log('- copy distro template\n')
            }

            const packagesLocalisation = Pacman.packagesLocalisation()
            if (packagesLocalisation.length > 0) {
               console.log(chalk.yellow('  apt install --yes --no-install-recommends live-task-localisation ' + Pacman.debs2line(packagesLocalisation)) + '\n')
            } else {
               console.log()
            }
         }

         if (i.calamares) {
            console.log('- install calamares')
            const packages = await Pacman.debs4calamares
            console.log(chalk.yellow('  apt install -y ' + Pacman.debs2line(packages) + '\n'))
         }

         if (i.needApt) {
            console.log('- cleaning apt\n')
         }

         if (i.configuration || i.needApt) {
            console.log('- creating/updating configuration')
            console.log('  files: ' + chalk.yellow('/etc/penguins-eggs.d/eggs.yaml') + ' and ' + chalk.yellow('/usr/local/share/penguins-eggs/exclude.list\n'))
         }

         if (i.needApt) {
            Utils.warning('Be sure! It\'s just a series of apt install from your repositories. You can follows them using flag --verbose')
         }
      }
      return i
   }


   /**
    * 
    * @param i
    * @param verbose 
    */
   static async install(i: IInstall, verbose = false) {
      const echo = Utils.setEcho(verbose)

      if (i.configuration) {
         await Pacman.configurationInstall(verbose)
      }

      if (i.distroTemplate) {
         await Pacman.distroTemplateInstall(verbose)
      }

      if (i.needApt) {
         Utils.warning('apt-get update --yes')
         await exec('apt-get update --yes', echo)
      }

      if (i.efi) {
         Utils.warning('Installing uefi support...')
         await Pacman.packageInstall('grub-efi-amd64')
      }

      if (i.prerequisites) {
         Utils.warning('Installing prerequisites...')
         await Pacman.prerequisitesInstall(verbose)
      }

      if (i.calamares) {
         Utils.warning('Installing calamares...')
         await Pacman.calamaresInstall(verbose)
      }

      if (i.needApt || i.calamares) {
         Utils.warning('cleaning the system...')
         const bleach = new Bleach()
         await bleach.clean(verbose)
      }

      if (i.configuration) {
         await Pacman.configurationInstall(verbose)
      }
   }
}