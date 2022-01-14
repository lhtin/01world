# GCC 命令

- `-fdump-tree-all-all`： all后面加上all可以dump更多的调试信息出来，方便理解pass的情况
- `-fdump-rtl-all`、`-fdump-rtl-all-graph`： 首先生成dump file，然后根据dump file生成对应的.dot文件，然后通过`dot -O -Tpng xxx.dot`生成png图片
- `-save-temps`： 将中间文件，比如编译可执行程序时，将预处理后的结果（`.i`）、汇编结果（`.s`）和目标文件（`.o`）保存起来
- `-dumpdir dir`： 表示将生成的文件放到`dir`目录中，比如上面三个参数生成的文件：`-fdump-tree-all -fdump-rtl-all -save-temps -dumpdir dir`
- `fno-builtin`：告诉编译器不要识别不带`__builtin_`前缀的builtin方法，也就是说把它当作普通方法对待
- `-nostdlib`：链接时不默认链接标准库，比如libc、libgcc等。
- `-v`： 打印GCC driver实际调用的各个阶段的程序。
  
  比如当需要调试编译器时，可以拷贝下面运行的cc1的命令，前面带上`gdb --args`即可：`gdb --args /path/to/gcc/bin/../libexec/gcc/x86_64-pc-linux-gnu/12.0.0/cc1 -quiet -v -iprefix /path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/ hello.c -quiet -dumpdir a- -dumpbase hello.c -dumpbase-ext .c -mtune=generic -march=x86-64 -version -o /tmp/ccK38nl3.s`
  
  ```
  Using built-in specs.
  COLLECT_GCC=/path/to/gcc/bin/gcc
  COLLECT_LTO_WRAPPER=/path/to/gcc/bin/../libexec/gcc/x86_64-pc-linux-gnu/12.0.0/lto-wrapper
  Target: x86_64-pc-linux-gnu
  Configured with: ../gcc/configure --prefix=/home/lding/apps/gcc --enable-languages=c,c++ --disable-multilib
  Thread model: posix
  Supported LTO compression algorithms: zlib
  gcc version 12.0.0 20210928 (experimental) (GCC)
  COLLECT_GCC_OPTIONS='-v' '-mtune=generic' '-march=x86-64' '-dumpdir' 'a-'
   /path/to/gcc/bin/../libexec/gcc/x86_64-pc-linux-gnu/12.0.0/cc1 -quiet -v -iprefix /path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/ hello.c -quiet -dumpdir a- -dumpbase hello.c -dumpbase-ext .c -mtune=generic -march=x86-64 -version -o /tmp/ccK38nl3.s
  GNU C17 (GCC) version 12.0.0 20210928 (experimental) (x86_64-pc-linux-gnu)
          compiled by GNU C version 12.0.0 20210928 (experimental), GMP version 6.0.0, MPFR version 3.1.1, MPC version 1.0.1, isl version none
  GGC heuristics: --param ggc-min-expand=30 --param ggc-min-heapsize=4096
  ignoring nonexistent directory "/path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/../../../../x86_64-pc-linux-gnu/include"
  ignoring duplicate directory "/path/to/gcc/bin/../lib/gcc/../../lib/gcc/x86_64-pc-linux-gnu/12.0.0/include"
  ignoring duplicate directory "/path/to/gcc/bin/../lib/gcc/../../lib/gcc/x86_64-pc-linux-gnu/12.0.0/include-fixed"
  ignoring nonexistent directory "/path/to/gcc/bin/../lib/gcc/../../lib/gcc/x86_64-pc-linux-gnu/12.0.0/../../../../x86_64-pc-linux-gnu/include"
  #include "..." search starts here:
  #include <...> search starts here:
   /path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/include
   /path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/include-fixed
   /usr/local/include
   /path/to/gcc/bin/../lib/gcc/../../include
   /usr/include
  End of search list.
  GNU C17 (GCC) version 12.0.0 20210928 (experimental) (x86_64-pc-linux-gnu)
          compiled by GNU C version 12.0.0 20210928 (experimental), GMP version 6.0.0, MPFR version 3.1.1, MPC version 1.0.1, isl version none
  GGC heuristics: --param ggc-min-expand=30 --param ggc-min-heapsize=4096
  Compiler executable checksum: 88cd59bf6ef807dbe47195c7b09fe0ee
  COLLECT_GCC_OPTIONS='-v' '-mtune=generic' '-march=x86-64' '-dumpdir' 'a-'
   as -v --64 -o /tmp/cce83hPF.o /tmp/ccK38nl3.s
  GNU assembler version 2.27 (x86_64-redhat-linux) using BFD version version 2.27-44.base.el7
  COMPILER_PATH=/path/to/gcc/bin/../libexec/gcc/x86_64-pc-linux-gnu/12.0.0/:/path/to/gcc/bin/../libexec/gcc/
  LIBRARY_PATH=/path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/:/path/to/gcc/bin/../lib/gcc/:/path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/../../../../lib64/:/lib/../lib64/:/usr/lib/../lib64/:/path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/../../../:/lib/:/usr/lib/
  COLLECT_GCC_OPTIONS='-v' '-mtune=generic' '-march=x86-64' '-dumpdir' 'a.'
   /path/to/gcc/bin/../libexec/gcc/x86_64-pc-linux-gnu/12.0.0/collect2 -plugin /path/to/gcc/bin/../libexec/gcc/x86_64-pc-linux-gnu/12.0.0/liblto_plugin.so -plugin-opt=/path/to/gcc/bin/../libexec/gcc/x86_64-pc-linux-gnu/12.0.0/lto-wrapper -plugin-opt=-fresolution=/tmp/ccKjbVli.res -plugin-opt=-pass-through=-lgcc -plugin-opt=-pass-through=-lgcc_s -plugin-opt=-pass-through=-lc -plugin-opt=-pass-through=-lgcc -plugin-opt=-pass-through=-lgcc_s --eh-frame-hdr -m elf_x86_64 -dynamic-linker /lib64/ld-linux-x86-64.so.2 /lib/../lib64/crt1.o /lib/../lib64/crti.o /path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/crtbegin.o -L/path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0 -L/path/to/gcc/bin/../lib/gcc -L/path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/../../../../lib64 -L/lib/../lib64 -L/usr/lib/../lib64 -L/path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/../../.. /tmp/cce83hPF.o -lgcc --as-needed -lgcc_s --no-as-needed -lc -lgcc --as-needed -lgcc_s --no-as-needed /path/to/gcc/bin/../lib/gcc/x86_64-pc-linux-gnu/12.0.0/crtend.o /lib/../lib64/crtn.o
  COLLECT_GCC_OPTIONS='-v' '-mtune=generic' '-march=x86-64' '-dumpdir' 'a.'
  ```
- `-fdump-passes`： 打印编译过程运行的pass
  ```
  # 比如-O3会运行的pass：
  *warn_unused_result                                 :  ON
  *diagnose_omp_blocks                                :  OFF
  *diagnose_tm_blocks                                 :  OFF
  tree-omp_oacc_kernels_decompose                     :  OFF
  tree-omplower                                       :  ON
  tree-lower                                          :  ON
  tree-tmlower                                        :  OFF
  tree-ehopt                                          :  OFF
  tree-eh                                             :  ON
  tree-coro-lower-builtins                            :  OFF
  tree-cfg                                            :  ON
  *warn_function_return                               :  ON
  tree-coro-early-expand-ifns                         :  OFF
  tree-ompexp                                         :  ON
  tree-walloca1                                       :  ON
  *build_cgraph_edges                                 :  ON
  *free_lang_data                                     :  ON
  ipa-visibility                                      :  ON
  ipa-build_ssa_passes                                :  ON
    tree-fixup_cfg1                                  :  ON
    tree-ssa                                         :  ON
    tree-warn-printf                                 :  OFF
    *nonnullcmp                                      :  OFF
    *early_warn_uninitialized                        :  OFF
    tree-ubsan                                       :  OFF
    tree-nothrow                                     :  ON
    *rebuild_cgraph_edges                            :  ON
  ipa-opt_local_passes                                :  ON
    tree-fixup_cfg2                                  :  ON
    *rebuild_cgraph_edges                            :  ON
    tree-local-fnsummary1                            :  ON
    tree-einline                                     :  ON
    *infinite-recursion                              :  OFF
    tree-early_optimizations                         :  ON
        *remove_cgraph_callee_edges                   :  ON
        tree-early_objsz                              :  ON
        tree-ccp1                                     :  ON
        tree-forwprop1                                :  ON
        tree-ethread                                  :  ON
        tree-esra                                     :  ON
        tree-ealias                                   :  ON
        tree-fre1                                     :  ON
        tree-evrp                                     :  ON
        tree-mergephi1                                :  ON
        tree-dse1                                     :  ON
        tree-cddce1                                   :  ON
        tree-phiopt1                                  :  ON
        tree-tailr1                                   :  ON
        tree-iftoswitch                               :  ON
        tree-switchconv                               :  ON
        tree-ehcleanup1                               :  OFF
        tree-profile_estimate                         :  ON
        tree-local-pure-const1                        :  ON
        tree-modref1                                  :  ON
        tree-fnsplit                                  :  ON
        *strip_predict_hints                          :  ON
    tree-release_ssa                                 :  ON
    *rebuild_cgraph_edges                            :  ON
    tree-local-fnsummary2                            :  ON
  ipa-remove_symbols                                  :  ON
  ipa-ipa_oacc                                        :  OFF
    ipa-pta1                                         :  OFF
    ipa-ipa_oacc_kernels                             :  ON
        tree-oacc_kernels                             :  OFF
          tree-ch1                                   :  ON
          tree-fre2                                  :  ON
          tree-lim1                                  :  ON
          tree-dom1                                  :  ON
          tree-dce1                                  :  ON
          tree-parloops1                             :  OFF
          tree-ompexpssa1                            :  ON
          *rebuild_cgraph_edges                      :  ON
  ipa-targetclone                                     :  ON
  ipa-afdo                                            :  OFF
  ipa-profile                                         :  OFF
    tree-feedback_fnsplit                            :  OFF
  ipa-free-fnsummary1                                 :  ON
  ipa-increase_alignment                              :  ON
  ipa-tmipa                                           :  OFF
  ipa-emutls                                          :  OFF
  ipa-analyzer                                        :  OFF
  ipa-odr                                             :  OFF
  ipa-whole-program                                   :  ON
  ipa-profile_estimate                                :  ON
  ipa-icf                                             :  ON
  ipa-devirt                                          :  ON
  ipa-cp                                              :  ON
  ipa-sra                                             :  ON
  ipa-cdtor                                           :  OFF
  ipa-fnsummary                                       :  ON
  ipa-inline                                          :  ON
  ipa-pure-const                                      :  ON
  ipa-modref                                          :  ON
  ipa-free-fnsummary2                                 :  ON
  ipa-static-var                                      :  ON
  ipa-single-use                                      :  ON
  ipa-comdats                                         :  ON
  ipa-pta2                                            :  OFF
  ipa-simdclone                                       :  OFF
  tree-fixup_cfg3                                     :  ON
  tree-ehdisp                                         :  OFF
  tree-oaccloops                                      :  OFF
  tree-omp_oacc_neuter_broadcast                      :  OFF
  tree-oaccdevlow                                     :  OFF
  tree-ompdevlow                                      :  ON
  tree-omptargetlink                                  :  OFF
  tree-adjust_alignment                               :  ON
  *all_optimizations                                  :  ON
    *remove_cgraph_callee_edges                      :  ON
    *strip_predict_hints                             :  ON
    tree-ccp2                                        :  ON
    tree-objsz1                                      :  ON
    tree-post_ipa_warn1                              :  OFF
    tree-cunrolli                                    :  ON
    tree-backprop                                    :  ON
    tree-phiprop                                     :  ON
    tree-forwprop2                                   :  ON
    tree-alias                                       :  ON
    tree-retslot                                     :  ON
    tree-fre3                                        :  ON
    tree-mergephi2                                   :  ON
    tree-threadfull1                                 :  ON
    tree-vrp1                                        :  ON
    tree-dse2                                        :  ON
    tree-dce2                                        :  ON
    tree-stdarg                                      :  ON
    tree-cdce                                        :  ON
    tree-cselim                                      :  ON
    tree-copyprop1                                   :  ON
    tree-ifcombine                                   :  ON
    tree-mergephi3                                   :  ON
    tree-phiopt2                                     :  ON
    tree-tailr2                                      :  ON
    tree-ch2                                         :  ON
    tree-cplxlower1                                  :  ON
    tree-sra                                         :  ON
    tree-thread1                                     :  ON
    tree-dom2                                        :  ON
    tree-copyprop2                                   :  ON
    tree-isolate-paths                               :  ON
    tree-reassoc1                                    :  ON
    tree-dce3                                        :  ON
    tree-forwprop3                                   :  ON
    tree-phiopt3                                     :  ON
    tree-ccp3                                        :  ON
    tree-sincos                                      :  ON
    tree-bswap                                       :  ON
    tree-laddress                                    :  ON
    tree-lim2                                        :  ON
    tree-walloca2                                    :  ON
    tree-pre                                         :  ON
    tree-sink1                                       :  ON
    tree-sancov1                                     :  OFF
    tree-asan1                                       :  OFF
    tree-tsan1                                       :  OFF
    tree-dse3                                        :  ON
    tree-dce4                                        :  ON
    tree-fix_loops                                   :  ON
    tree-loop                                        :  ON
        tree-loopinit                                 :  ON
        tree-unswitch                                 :  ON
        tree-sccp                                     :  ON
        tree-lsplit                                   :  ON
        tree-lversion                                 :  ON
        tree-unrolljam                                :  ON
        tree-cddce2                                   :  ON
        tree-ivcanon                                  :  ON
        tree-ldist                                    :  ON
        tree-linterchange                             :  ON
        tree-copyprop3                                :  ON
        tree-graphite0                                :  OFF
          tree-graphite                              :  OFF
          tree-lim3                                  :  ON
          tree-copyprop4                             :  ON
          tree-dce5                                  :  ON
        tree-parloops2                                :  OFF
        tree-ompexpssa2                               :  ON
        tree-ch_vect                                  :  ON
        tree-ifcvt                                    :  ON
        tree-vect                                     :  ON
          tree-dce6                                  :  ON
        tree-pcom                                     :  ON
        tree-cunroll                                  :  ON
        *pre_slp_scalar_cleanup                       :  OFF
          tree-fre4                                  :  ON
          tree-dse4                                  :  ON
        tree-slp1                                     :  ON
        tree-aprefetch                                :  OFF
        tree-ivopts                                   :  ON
        tree-lim4                                     :  ON
        tree-loopdone                                 :  ON
    tree-no_loop                                     :  OFF
        tree-slp2                                     :  ON
    tree-simduid1                                    :  OFF
    tree-veclower21                                  :  ON
    tree-switchlower1                                :  ON
    tree-recip                                       :  OFF
    tree-reassoc2                                    :  ON
    tree-slsr                                        :  ON
    tree-split-paths                                 :  ON
    tree-tracer                                      :  OFF
    tree-fre5                                        :  ON
    tree-thread2                                     :  ON
    tree-dom3                                        :  ON
    tree-strlen1                                     :  ON
    tree-threadfull2                                 :  ON
    tree-vrp2                                        :  ON
    tree-ccp4                                        :  ON
    tree-wrestrict                                   :  ON
    tree-dse5                                        :  ON
    tree-cddce3                                      :  ON
    tree-forwprop4                                   :  ON
    tree-phiopt4                                     :  ON
    tree-fab1                                        :  ON
    tree-widening_mul                                :  ON
    tree-sink2                                       :  ON
    tree-store-merging                               :  ON
    tree-tailc                                       :  ON
    tree-dce7                                        :  ON
    tree-crited1                                     :  ON
    tree-uninit1                                     :  OFF
    tree-local-pure-const2                           :  ON
    tree-modref2                                     :  ON
    tree-uncprop1                                    :  ON
  *all_optimizations_g                                :  OFF
    *remove_cgraph_callee_edges                      :  ON
    *strip_predict_hints                             :  ON
    tree-cplxlower2                                  :  ON
    tree-veclower22                                  :  ON
    tree-switchlower2                                :  ON
    tree-ccp5                                        :  ON
    tree-post_ipa_warn2                              :  OFF
    tree-objsz2                                      :  ON
    tree-fab2                                        :  ON
    tree-strlen2                                     :  ON
    tree-copyprop5                                   :  ON
    tree-dce8                                        :  ON
    tree-sancov2                                     :  OFF
    tree-asan2                                       :  OFF
    tree-tsan2                                       :  OFF
    tree-crited2                                     :  ON
    tree-uninit2                                     :  OFF
    tree-local-pure-const3                           :  ON
    tree-modref3                                     :  ON
    tree-uncprop2                                    :  ON
  *tminit                                             :  OFF
    tree-tmmark                                      :  ON
    tree-tmmemopt                                    :  OFF
    tree-tmedge                                      :  ON
  tree-simduid2                                       :  OFF
  tree-vtable-verify                                  :  OFF
  tree-lower_vaarg                                    :  ON
  tree-veclower                                       :  ON
  tree-cplxlower0                                     :  ON
  tree-sancov_O0                                      :  OFF
  tree-switchlower_O0                                 :  OFF
  tree-asan0                                          :  OFF
  tree-tsan0                                          :  OFF
  tree-sanopt                                         :  OFF
  tree-ehcleanup2                                     :  OFF
  tree-resx                                           :  OFF
  tree-nrv                                            :  ON
  tree-isel                                           :  ON
  tree-hardcbr                                        :  OFF
  tree-hardcmp                                        :  OFF
  tree-optimized                                      :  ON
  *warn_function_noreturn                             :  OFF
  tree-waccess                                        :  ON
  rtl-expand                                          :  ON
  *rest_of_compilation                                :  ON
    rtl-vregs                                        :  ON
    rtl-into_cfglayout                               :  ON
    rtl-jump                                         :  ON
    rtl-subreg1                                      :  ON
    rtl-dfinit                                       :  ON
    rtl-cse1                                         :  ON
    rtl-fwprop1                                      :  ON
    rtl-cprop1                                       :  ON
    rtl-rtl pre                                      :  ON
    rtl-hoist                                        :  OFF
    rtl-cprop2                                       :  ON
    rtl-store_motion                                 :  OFF
    rtl-shorten_memrefs                              :  ON
    rtl-cse_local                                    :  OFF
    rtl-ce1                                          :  ON
    rtl-reginfo                                      :  ON
    rtl-loop2                                        :  ON
        rtl-loop2_init                                :  ON
        rtl-loop2_invariant                           :  ON
        rtl-loop2_unroll                              :  OFF
        rtl-loop2_doloop                              :  OFF
        rtl-loop2_done                                :  ON
    rtl-subreg2                                      :  OFF
    rtl-web                                          :  OFF
    rtl-cprop3                                       :  ON
    rtl-cse2                                         :  ON
    rtl-dse1                                         :  ON
    rtl-fwprop2                                      :  ON
    rtl-auto_inc_dec                                 :  OFF
    rtl-init-regs                                    :  ON
    rtl-ud_dce                                       :  ON
    rtl-combine                                      :  ON
    rtl-insert_vsetvli                               :  ON
    rtl-ce2                                          :  ON
    rtl-jump_after_combine                           :  ON
    rtl-bbpart                                       :  OFF
    rtl-outof_cfglayout                              :  ON
    rtl-split1                                       :  ON
    rtl-subreg3                                      :  ON
    rtl-no-opt dfinit                                :  OFF
    *stack_ptr_mod                                   :  ON
    rtl-mode_sw                                      :  OFF
    rtl-asmcons                                      :  ON
    rtl-sms                                          :  OFF
    rtl-lr_shrinkage                                 :  OFF
    rtl-sched1                                       :  ON
    rtl-early_remat                                  :  ON
    rtl-ira                                          :  ON
    rtl-reload                                       :  ON
    *all-postreload                                  :  OFF
        rtl-postreload                                :  OFF
        rtl-gcse2                                     :  ON
        rtl-split2                                    :  ON
        rtl-ree                                       :  ON
        rtl-cmpelim                                   :  OFF
        rtl-pro_and_epilogue                          :  ON
        rtl-dse2                                      :  ON
        rtl-csa                                       :  OFF
        rtl-jump2                                     :  ON
        rtl-compgotos                                 :  ON
        rtl-sched_fusion                              :  OFF
        rtl-peephole2                                 :  ON
        rtl-ce3                                       :  ON
        rtl-rnreg                                     :  OFF
        rtl-cprop_hardreg                             :  ON
        rtl-rtl_dce                                   :  ON
        rtl-bbro                                      :  ON
        *leaf_regs                                    :  ON
        rtl-split3                                    :  ON
        rtl-sched2                                    :  ON
        *stack_regs                                   :  OFF
          rtl-split4                                 :  OFF
          rtl-stack                                  :  ON
    *all-late_compilation                            :  OFF
        rtl-zero_call_used_regs                       :  ON
        rtl-alignments                                :  ON
        rtl-vartrack                                  :  OFF
        *free_cfg                                     :  ON
        rtl-mach                                      :  ON
        rtl-barriers                                  :  ON
        rtl-dbr                                       :  OFF
        rtl-split5                                    :  ON
        rtl-eh_ranges                                 :  OFF
        rtl-shorten                                   :  ON
        rtl-nothrow                                   :  ON
        rtl-dwarf2                                    :  OFF
        rtl-final                                     :  ON
    rtl-dfinish                                      :  ON
  *clean_state                                        :  ON
   ```
