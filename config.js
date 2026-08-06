const SUPPORTED_FILES = ["abl.img", "aop.img", "aop_config.img", "apusys.img", "audio_dsp.img", "bluetooth.img", "boot.img", "ccu.img", "connsys_bt.img", "connsys_gnss.img", "connsys_wifi.img", "countrycode.img", "cpucp.img", "cpucp_dtb.img", "devcfg.img", "dpm.img", "dsp.img", "dtbo.img", "featenabler.img", "gpueb.img", "gz.img", "hyp.img", "imagefv.img", "init_boot.img", "keymaster.img", "lk.img", "logo.img", "mcf_ota.img", "mcupm.img", "md1img.img", "modem.img", "mvpu_algo.img", "odm_dlkm.img", "pi_img.img", "preloader.img", "preloader_emmc.img", "preloader_raw.img", "preloader_ufs.img", "qupfw.img", "recovery.img", "scp.img", "shrm.img", "spmfw.img", "sspm.img", "super_empty.img", "system_dlkm.img", "tee.img", "tz.img", "uefi.img", "uefisecapp.img", "vbmeta.img", "vbmeta_system.img", "vbmeta_vendor.img", "vcp.img", "vendor_boot.img", "vendor_dlkm.img", "vendor_kernel_boot.img", "xbl.img", "xbl_config.img", "xbl_ramdump.img"]

const API_CONFIG = {
    baseUrl: 'https://offici5l-fcetool.hf.space',
    endpoints: {
        extract: '/extract',
        check: '/check'
    }
};