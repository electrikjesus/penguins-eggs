/**
 * penguins-eggs: iso.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * Al momento popolo solo le directory live ed isolinux, mentre boot ed EFI no!
 * createStructure
 * isolinuxPrepare, isolinuxCfg
 * liveKernel, liveSquashFs
 * makeIso
 */
"use strict";

var __importDefault = undefined && undefined.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const utils_1 = __importDefault(require("./utils"));
/**
 * Iso:
 */
class Iso {
    constructor(app, workDir, distro, net, user, root) {
        this.app = {};
        this.distro = {};
        this.net = {};
        this.user = {};
        this.root = {};
        this.app = app;
        if (workDir == undefined) {
            this.workDir = "/var/lib/vz/eggs/";
        } else {
            this.workDir = workDir;
        }
        if (distro == undefined) {
            this.distro.name = 'penguin';
            this.distro.kernel = utils_1.default.kernerlVersion();
        } else {
            this.distro.name = distro.name;
            this.distro.kernel = distro.kernel;
        }
        this.distro.pathHome = workDir + `${this.distro.name}`;
        this.distro.pathFs = this.distro.pathHome + `/fs`;
        this.distro.pathIso = this.distro.pathHome + `/iso`;
        this.distro.syslinux = distro.syslinux;
        this.distro.isolinux = distro.isolinux;
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
        this.net.name = utils_1.default.netDeviceName();
        this.net.domainName = "lan";
        this.net.dnsAddress = utils_1.default.netDns();
        if (user == undefined) {
            this.user.name = "artisan";
            this.user.fullName = "Artisan";
            this.user.password = "evolution";
        } else {
            this.user.name = user.name;
            this.user.fullName = user.fullName;
            this.user.password = user.password;
        }
        if (root == undefined) {
            this.root.name = "root";
            this.root.fullName = "root";
            this.root.password = "evolution";
        } else {
            this.root.name = user.name;
            this.root.fullName = user.fullName;
            this.root.password = user.password;
        }
    }
    type() {}
    show() {
        console.log("eggs: iso parameters ");
        console.log(">>> kernelVer: " + this.distro.kernel);
        console.log(">>> netDomainName: " + this.net.domainName);
    }
    async createStructure() {
        console.log("==========================================");
        console.log("iso: createStructure");
        console.log("==========================================");
        if (!fs_1.default.existsSync(this.distro.pathIso)) {
            utils_1.default.exec(`mkdir -p ${this.distro.pathIso}/live`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathIso}/isolinux`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathIso}/EFI`);
            utils_1.default.exec(`mkdir -p ${this.distro.pathIso}/boot`);
        }
    }
    async kill() {
        console.log("==========================================");
        console.log("iso: kill rm -rf ${this.distro.pathIso}");
        console.log("==========================================");
        utils_1.default.exec(`rm -rf ${this.distro.pathIso}`);
    }
    async isolinuxPrepare() {
        console.log("==========================================");
        console.log("iso: isolinuxPrepare");
        console.log("==========================================");
        let isolinuxbin = `${this.distro.isolinux}isolinux.bin`;
        let vesamenu = `${this.distro.syslinux}vesamenu.c32`;
        utils_1.default.exec(`rsync -a ${this.distro.syslinux}chain.c32 ${this.distro.pathIso}/isolinux/`);
        utils_1.default.exec(`rsync -a ${this.distro.syslinux}ldlinux.c32 ${this.distro.pathIso}/isolinux/`);
        utils_1.default.exec(`rsync -a ${this.distro.syslinux}libcom32.c32 ${this.distro.pathIso}/isolinux/`);
        utils_1.default.exec(`rsync -a ${this.distro.syslinux}libutil.c32 ${this.distro.pathIso}/isolinux/`);
        utils_1.default.exec(`rsync -a ${isolinuxbin} ${this.distro.pathIso}/isolinux/`);
        utils_1.default.exec(`rsync -a ${vesamenu} ${this.distro.pathIso}/isolinux/`);
    }
    async isolinuxCfg() {
        console.log("==========================================");
        console.log("iso: isolinuxCfg");
        console.log("==========================================");
        let file = `${this.distro.pathIso}/isolinux/isolinux.cfg`;
        let text = `
# Generated by penguins-eggs
DEFAULT vesamenu.c32
PROMPT 0
TIMEOUT 30
MENU TITLE CD/DVD ${this.app.name} ${this.app.version} ${utils_1.default.date4label()}
MENU TABMSG Press TAB key to edit
MENU BACKGROUND turtle.png

LABEL ${this.distro.name}
  MENU LABEL ^${this.distro.name}
  kernel /live/vmlinuz
  append boot=live initrd=/live/initrd.img quiet splash nouveau.modeset=0

label ${this.distro.name} safe
  MENU LABEL ^${this.distro.name} safe
  kernel /live/vmlinuz
  append boot=live initrd=/live/initrd.img xforcevesa nomodeset quiet splash`;
        utils_1.default.bashWrite(file, text);
        let path = utils_1.default.path();
        utils_1.default.exec(`cp ${__dirname}/../../assets/turtle.png ${this.distro.pathIso}/isolinux`);
    }
    /**
     * alive: rende live
     */
    async liveKernel() {
        console.log("==========================================");
        console.log("iso: liveKernel");
        console.log("==========================================");
        utils_1.default.exec(`cp /vmlinuz ${this.distro.pathIso}/live/`);
        utils_1.default.exec(`cp /initrd.img ${this.distro.pathIso}/live/`);
    }
    /**
     * squashFs: crea in live filesystem.squashfs
     */
    async liveSquashFs() {
        console.log("==========================================");
        console.log("iso: liveSquashFs");
        console.log("==========================================");
        let option = "-comp xz";
        utils_1.default.exec(`mksquashfs ${this.distro.pathFs} ${this.distro.pathIso}/live/filesystem.squashfs ${option} -noappend`);
    }
    async makeIsoFs() {
        console.log("==========================================");
        console.log("iso: makeIsoFs");
        console.log("==========================================");
        let isoHybridOption = `-isohybrid-mbr ${this.distro.isolinux}isohdpfx.bin `;
        //let uefiOption = "";
        //"-eltorito-alt-boot -e boot/grub/efiboot.img -isohybrid-gpt-basdat -no-emul-boot";
        let volid = `"Penguin's eggs ${this.distro.name}"`;
        let isoName = `${this.workDir}/${this.distro.name}`;
        isoName += utils_1.default.date4file() + ".iso";
        utils_1.default.exec(`xorriso -as mkisofs -r -J -joliet-long -l -cache-inodes ${isoHybridOption} -partition_offset 16 -volid ${volid} -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o ${isoName} ${this.distro.pathIso}`);
    }
}
exports.default = Iso;
//# sourceMappingURL=Iso.js.map