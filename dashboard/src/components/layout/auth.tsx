// Chakra imports
import { Box, HStack, Image, Spacer, Text } from '@chakra-ui/react';
import { config } from '@/config/common';
import { ReactNode } from 'react';
import { SelectField } from '../forms/SelectField';
import { languages, names, useLang } from '@/config/translations/provider';
import { common } from '@/config/translations/common';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Box w="full" h="full" overflow="auto" py={40} px={{ base: 5, lg: 10 }}>
      {children}
      <HStack
        pos="fixed"
        top={0}
        left={0}
        w="full"
        bg="MainBackground"
        px={{ base: 5, lg: 10 }}
        py={2}
      >
        {config.icon != null && <Image src={config.icon} boxSize={10} alt='Logo'/>}
        <Text fontWeight="600" fontSize="lg">
          {config.name}
        </Text>
        <Spacer />
        <Box w="150px">
          <LanguageSelect />
        </Box>
      </HStack>
    </Box>
  );
}

function LanguageSelect() {
  const { lang, setLang } = useLang();
  const t = common.useTranslations();

  return (
    <SelectField
      id="lang"
      value={{
        label: names[lang],
        value: lang,
      }}
      onChange={(e) => e != null && setLang(e.value)}
      options={languages.map(({ name, key }) => ({
        label: name,
        value: key,
      }))}
      placeholder={t['select lang']}
    />
  );
}
