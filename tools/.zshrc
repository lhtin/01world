# tintin's .zshrc config

export PATH=/work/tools/Xilinx/Vivado/2018.3/bin:$HOME/apps/bin:$HOME/apps/riscv/bin:$HOME/bin:/usr/local/bin:$PATH
export RISCV=$HOME/apps/riscv
export ZSH=$HOME/.oh-my-zsh
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# for REPO
export REPO_URL=https://gitlab.com/lhtin-rivai/git-repo.git

ZSH_THEME="robbyrussell"

plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh

alias repo-env="source build/env.sh"
alias repo-list="echo \"Current PROJ_ROOT = $PROJ_ROOT\" && echo \"Current RISCV     = $RISCV\""

echo "Hello `hostname`!"
