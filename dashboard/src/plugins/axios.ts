import { i18n } from "@/i18n";
import axios, { AxiosError } from "axios";

/** The frontend is served from the same origin as the backend (or proxied by Vite in development) */
export const api = axios.create({
	withCredentials: true,
});

export type Response<T> = {
	code: number;
	data: T;
	message?: string;
};

/** Human readable message from an API error */
export const getErrorMessage = (error: unknown) => {
	if (error instanceof AxiosError) {
		const data = error.response?.data as { message?: unknown } | undefined;
		if (typeof data?.message === "string") return data.message;
		return error.message;
	}

	if (error instanceof Error) return error.message;
	return i18n.global.t("common.somethingWrong");
};
