/*
  penguins-eggs: iso.ts
  author: Piero Proietti
  mail: piero.proietti@gmail.com
*/
"use strict";

import fs from "fs";
import utils from "./utils";
import { IDistro, INet, IUser, IPackage } from "../interfaces";


class Iso {
  // Properties
  private app: IPackage;
  private workDir: string;

  private distro: IDistro;
  private net: INet;
  private user: IUser;
  private root: IUser;

  constructor(
    app: IPackage,
    workDir?: string,
    distro?: IDistro,
    net?: INet,
    user?: IUser,
    root?: IUser
  ) {
    this.app = {} as IPackage;
    this.distro = {} as IDistro;
    this.net = {} as INet;
    this.user = {} as IUser;
    this.root = {} as IUser;

    this.app = app;
    
    if (workDir == undefined){
      this.workDir = "/var/lib/vz/eggs/";
    } else{
      this.workDir = workDir;
    }

    if (distro == undefined) {
      this.distro.name = 'penguin';
      this.distro.kernel = utils.kernerlVersion();
    } else {
      this.distro.name = distro.name;
      this.distro.kernel = distro.kernel;
    }
    this.distro.pathHome = workDir + `${this.distro.name}`;
    this.distro.pathFs = this.distro.pathHome + `/fs`;
    this.distro.pathIso = this.distro.pathHome + `/iso`;
  
    if (net == undefined) {
      this.net.dhcp = false;
      this.net.address = "192.168.61.100";
      this.net.netmask = "255.255.255.0";
      this.net.gateway = "192.168.61.1";
    } else {
      this.net.dhcp = net.dhcp;
      this.net.address = net.address;
      this.net.netmask = net.netmask;
      this.net.gateway = net.gateway;
    }
    this.net.name = utils.netDeviceName();
    this.net.domainName = "lan";
    this.net.dnsAddress = utils.netDns();

    if (user == undefined) {
      this.user.name = "artisan";
      this.user.fullName = "Artisan";
      this.user.password = "evolution"
    } else {
      this.user.name = user.name;
      this.user.fullName = user.fullName;
      this.user.password = user.password;
    }

    if (root == undefined) {
      this.root.name = "root";
      this.root.fullName = "root";
      this.root.password = "evolution"
    } else {
      this.root.name = user.name;
      this.root.fullName = user.fullName;
      this.root.password = user.password;
    }

  }

  show() {
    console.log("eggs: iso parameters ");
    console.log(">>> kernelVer: " + this.distro.kernel);
    console.log(">>> netDomainName: " + this.net.domainName);
  }

  async spawn() {
    console.log("==========================================");
    console.log("Incubator iso: spawn");
    console.log("==========================================");

    if (!fs.existsSync(this.distro.pathIso)) {
      utils.exec(`mkdir -p ${this.distro.pathIso}/live`);
      utils.exec(`mkdir -p ${this.distro.pathIso}/isolinux`);
      utils.exec(`mkdir -p ${this.distro.pathIso}/EFI`);
      utils.exec(`mkdir -p ${this.distro.pathIso}/boot`);
    }
  }

  async kill() {
    console.log("==========================================");
    console.log("Incubator iso: kill");
    console.log("==========================================");
    utils.exec(`rm -rf ${this.distro.pathIso}`);
  }

  async isolinux() {
    let isolinuxbin = "/usr/lib/ISOLINUX/isolinux.bin";
    let vesamenu = "/usr/lib/syslinux/modules/bios/vesamenu.c32";

    utils.exec(
      `rsync -a /usr/lib/syslinux/modules/bios/chain.c32 ${this.distro.pathIso}/isolinux/`
    );
    utils.exec(
      `rsync -a /usr/lib/syslinux/modules/bios/ldlinux.c32 ${this.distro.pathIso}/isolinux/`
    );
    utils.exec(
      `rsync -a /usr/lib/syslinux/modules/bios/libcom32.c32 ${this.distro.pathIso}/isolinux/`
    );
    utils.exec(
      `rsync -a /usr/lib/syslinux/modules/bios/libutil.c32 ${this.distro.pathIso}/isolinux/`
    );
    utils.exec(`rsync -a ${isolinuxbin} ${this.distro.pathIso}/isolinux/`);
    utils.exec(`rsync -a ${vesamenu} ${this.distro.pathIso}/isolinux/`);
  }

  async isolinuxCfg() {
    let file = `${this.distro.pathIso}/isolinux/isolinux.cfg`;
    let text = `
# Generated by penguins-eggs
DEFAULT vesamenu.c32
PROMPT 0
TIMEOUT 30
MENU TITLE CD/DVD ${this.app.name} ${this.app.version} ${utils.date4label()}
MENU TABMSG Press TAB key to edit
MENU BACKGROUND turtle.png

LABEL ${this.distro.name}
  MENU LABEL ^${this.distro.name}
  kernel /live/vmlinuz
  append boot=live initrd=/live/initrd.img quiet splash

label ${this.distro.name} safe
  MENU LABEL ^${this.distro.name} safe
  kernel /live/vmlinuz
  append boot=live initrd=/live/initrd.img xforcevesa nomodeset quiet splash`;
    utils.bashWrite(file, text);

    let path = utils.path();
    utils.exec(`cp ${path}/src/assets/turtle.png ${this.distro.pathIso}/isolinux`);
  }

  async alive() {
    utils.exec(`cp /vmlinuz ${this.distro.pathIso}/live/`);
    utils.exec(`cp /initrd.img ${this.distro.pathIso}/live/`);
  }

  async squashFs() {
    let option = "-comp xz";
    utils.exec(
      `mksquashfs ${this.distro.pathFs} ${this.distro.pathIso}/live/filesystem.squashfs ${option} -noappend`
    );
  }

  async makeIso() {
    let isoHybridOption = "-isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin ";
    //let uefiOption = "";
    //"-eltorito-alt-boot -e boot/grub/efiboot.img -isohybrid-gpt-basdat -no-emul-boot";
    let volid = `"CholitOS ${this.distro.name}"`;
    let isoName = `${this.workDir}/${this.distro.name}`;
    isoName += utils.date4file() + ".iso";

    utils.exec(
      `xorriso -as mkisofs -r -J -joliet-long -l -cache-inodes ${isoHybridOption} -partition_offset 16 -volid ${volid} -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o ${isoName} ${this.distro.pathIso}`
    );
  }
}

export default Iso;
