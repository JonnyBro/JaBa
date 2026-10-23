import { i18n } from "@/i18n";
import { useClipboard } from "@vueuse/core";
import { toast } from "vue-sonner";

export const useCopy = () => {
	const { copy, copied, isSupported } = useClipboard({ legacy: true, copiedDuring: 1500 });

	const copyText = async (text: string, message = i18n.global.t("common.copied")) => {
		try {
			await copy(text);
			toast.success(message);
		} catch {
			toast.error(i18n.global.t("common.copyFailed"));
		}
	};

	return { copy: copyText, copied, isSupported };
};
