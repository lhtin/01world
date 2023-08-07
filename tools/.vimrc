set enc=utf-8
set nocompatible
source $VIMRUNTIME/vimrc_example.vim
set number
set ts=8
set expandtab
set autoindent
set hlsearch
set shell=zsh

" render tab and space chars
set listchars=tab:»\ ,space:·
set list
hi SpecialKey ctermfg=8

" save file history, support undo
set nobackup
set undodir=~/.vim/undodir
if !isdirectory(&undodir)
  call mkdir(&undodir, 'p', 0700)
endif

if has('mouse')
  if has('gui_running') || (&term =~ 'xterm' && !has('mac'))
    set mouse=a
  else
    set mouse=nvi
  endif
endif

" set cursor:
"   1. normal mode is steady block
"   2. insert mode is blinking bar
let &t_SI = "\e[5 q"
let &t_EI = "\e[2 q"

" exit terminal work mode
tnoremap <Esc><Esc> <C-\><C-N>

" Tagbar plugin
" https://github.com/preservim/tagbar
let g:tagbar_sort = 0
let g:tagbar_width = 60
nnoremap <silent> <F9> :TagbarToggle<CR>
