import { useEffect, useMemo, useState } from 'react';

import { useMonaco } from '@monaco-editor/react';
import { Popover } from '@/components/ui/popover';
import { PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import socket from "@/lib/socket.js";

export const LanguageSelector = ({ value, onChange }) => {
  const monaco = useMonaco();

  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');

  useEffect(() => {
    setSelectedLanguage(value || '');
    socket.on("update-language", (newLanguage) => {
      if (newLanguage !== value) {
        setSelectedLanguage(newLanguage);
        if (onChange) {
            onChange(newLanguage);
           }
        }
      });

    return () => {
      socket.off("update-language");
    };
  }, [value,onChange]);

  const allLanguages = useMemo(() => {
    const languages = monaco?.languages?.getLanguages();
    if (!!languages) return languages;

    return [];
  }, [monaco]);

  const handleChange = (currentValue) => {
    setSelectedLanguage(currentValue === selectedLanguage ? '' : currentValue);
    if (onChange) {
      onChange(currentValue);
    }
        // Emit to backend
        const roomId = window.location.pathname.split("/").pop();
        socket.emit("language-change", { roomId, language: currentValue });
    

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          className='min-w-[200px] w-full justify-between capitalize'>
          {selectedLanguage
            ? allLanguages.find(
                (language) => language.id === selectedLanguage
              )?.id
            : 'Select language...'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='min-w-[200px] w-full p-0'>
        <Command>
          <CommandInput placeholder='Search language...' />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {allLanguages.map((language) => (
                <CommandItem
                  className='capitalize'
                  key={language.id}
                  value={language.id}
                  onSelect={handleChange}>
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedLanguage === language.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {language.id}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};