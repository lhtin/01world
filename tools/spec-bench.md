# SPEC Benchmarks

> Standard Performance Evaluation Corporation (SPEC)

## SPEC CPU 2017

> Offical doc: https://www.spec.org/cpu2017/Docs/quick-start.html

- Linux Steps
  - `sudo mount -t iso9660 -o ro,exec,loop /path/to/your/cpu2017-x.x.x.iso /mnt-cpu2017-x.x.x` 挂在ios盘
  - `cd /mnt-cpu2017-x.x.x && ./install.sh -i -f -d /patch/to/your/install-dir` 将benchmark安装到 /patch/to/your/install-dir 路径
    - 输出日志（`./install.sh -i -f -d /home/lhtin/cpu2017-installed`）
      ```
      SPEC CPU2017 Installation
      
      Top of the CPU2017 tree is '/mnt-cpu2017'
      
      Installing FROM /mnt-cpu2017
      Installing TO /home/lhtin/cpu2017-installed
      
      
      The following toolset is expected to work on your platform.  If the
      automatically installed one does not work, please re-run install.sh and
      exclude that toolset using the '-e' switch.
      
      The toolset selected will not affect your benchmark scores.
      
      linux-x86_64                  For x86_64 Linux systems
                                    Built on Oracle Linux 6.0 with
                                    GCC v4.4.4 20100726 (Red Hat 4.4.4-13)
      
      
      
      =================================================================
      Attempting to install the linux-x86_64 toolset...
      
      
      Unpacking CPU2017 base files (44.9 MB)
      Unpacking CPU2017 tools binary files (150.2 MB)
      Unpacking 500.perlbench_r benchmark and data files (102 MB)
      Unpacking 502.gcc_r benchmark and data files (240.3 MB)
      Unpacking 503.bwaves_r benchmark and data files (0.2 MB)
      Unpacking 505.mcf_r benchmark and data files (8.5 MB)
      Unpacking 507.cactuBSSN_r benchmark and data files (12.5 MB)
      Unpacking 508.namd_r benchmark and data files (8.3 MB)
      Unpacking 510.parest_r benchmark and data files (25.6 MB)
      Unpacking 511.povray_r benchmark and data files (23.3 MB)
      Unpacking 519.lbm_r benchmark and data files (4.3 MB)
      Unpacking 520.omnetpp_r benchmark and data files (56.6 MB)
      Unpacking 521.wrf_r benchmark and data files (217.2 MB)
      Unpacking 523.xalancbmk_r benchmark and data files (212 MB)
      Unpacking 525.x264_r benchmark and data files (57.9 MB)
      Unpacking 526.blender_r benchmark and data files (215.7 MB)
      Unpacking 527.cam4_r benchmark and data files (348.6 MB)
      Unpacking 531.deepsjeng_r benchmark and data files (0.5 MB)
      Unpacking 538.imagick_r benchmark and data files (80.7 MB)
      Unpacking 541.leela_r benchmark and data files (3.8 MB)
      Unpacking 544.nab_r benchmark and data files (38.7 MB)
      Unpacking 548.exchange2_r benchmark and data files (0.1 MB)
      Unpacking 549.fotonik3d_r benchmark and data files (5.2 MB)
      Unpacking 554.roms_r benchmark and data files (11.4 MB)
      Unpacking 557.xz_r benchmark and data files (104.1 MB)
      Unpacking 600.perlbench_s benchmark and data files (3.1 MB)
      Unpacking 602.gcc_s benchmark and data files (0.9 MB)
      Unpacking 603.bwaves_s benchmark and data files (0 MB)
      Unpacking 605.mcf_s benchmark and data files (0.1 MB)
      Unpacking 607.cactuBSSN_s benchmark and data files (0.1 MB)
      Unpacking 619.lbm_s benchmark and data files (30.4 MB)
      Unpacking 620.omnetpp_s benchmark and data files (0.1 MB)
      Unpacking 621.wrf_s benchmark and data files (0.3 MB)
      Unpacking 623.xalancbmk_s benchmark and data files (0.1 MB)
      Unpacking 625.x264_s benchmark and data files (0.2 MB)
      Unpacking 627.cam4_s benchmark and data files (0.5 MB)
      Unpacking 628.pop2_s benchmark and data files (283.8 MB)
      Unpacking 631.deepsjeng_s benchmark and data files (0.2 MB)
      Unpacking 638.imagick_s benchmark and data files (0.3 MB)
      Unpacking 641.leela_s benchmark and data files (0 MB)
      Unpacking 644.nab_s benchmark and data files (0.1 MB)
      Unpacking 648.exchange2_s benchmark and data files (0 MB)
      Unpacking 649.fotonik3d_s benchmark and data files (0.1 MB)
      Unpacking 654.roms_s benchmark and data files (1.1 MB)
      Unpacking 657.xz_s benchmark and data files (0.2 MB)
      Unpacking 996.specrand_fs benchmark and data files (0 MB)
      Unpacking 997.specrand_fr benchmark and data files (0 MB)
      Unpacking 998.specrand_is benchmark and data files (0 MB)
      Unpacking 999.specrand_ir benchmark and data files (6.4 MB)
      
      Checking the integrity of your source tree...
      
      Checksums are all okay.
      
      Unpacking binary tools for linux-x86_64...
      
      Checking the integrity of your binary tools...
      
      Checksums are all okay.
      
      Testing the tools installation (this may take a minute)
      
      ...................................................................................................................................................................................................................................................................................................................-.......
      
      Installation successful.  Source the shrc or cshrc in
      /home/lhtin/cpu2017-installed
      to set up your environment for the benchmark.
      ```
  - `source shrc && runcpu --update` 更新到最新的SPEC，比如我当前的最新的是1.1.9版本
  - `cp config/Example-gcc-linux-x86.cfg config/my.cfg` 复制一份对应的配置
  - `runcpu --config=my --label=my_test --define gcc_dir:/usr --action=build 505.mcf_r` 编译一个例子试试
    - `gcc_dir:/usr` 表示gcc所在的目录，注意是bin/gcc的上一层
  
