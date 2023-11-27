#!/bin/bash

set -e
set -u
set -x
set -o pipefail

# ohmyzsh, zsh-autosuggestions, zsh-syntax-highlighting
sh -c "$(curl -fsSL https://gitlab.com/lhtin-rivai/ohmyzsh/-/raw/master/tools/install.sh)"
git clone https://gitlab.com/lhtin-rivai/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://gitlab.com/lhtin-rivai/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
sed -i -E "s/plugins=\(git\)/plugins=\(git zsh-autosuggestions zsh-syntax-highlighting\)/" ~/.zshrc

# disable some git check which slow zsh
git config --global --add oh-my-zsh.hide-status 1
git config --global --add oh-my-zsh.hide-dirty 1

# brew
/bin/bash -c "$(curl -fsSL https://gitlab.com/lhtin-rivai/brew-install/-/raw/tin/install.sh)"
