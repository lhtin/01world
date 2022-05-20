#!/bin/bash

# ohmyzsh, zsh-autosuggestions, zsh-syntax-highlighting
sh -c "$(curl -fsSL https://gitlab.com/lhtin-rivai/ohmyzsh/-/raw/master/tools/install.sh)"
git clone https://gitlab.com/lhtin-rivai/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://gitlab.com/lhtin-rivai/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# brew
/bin/bash -c "$(curl -fsSL https://gitlab.com/lhtin-rivai/brew-install/-/raw/tin/install.sh)"
