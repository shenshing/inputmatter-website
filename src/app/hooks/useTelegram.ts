declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        close(): void;
        expand(): void;
        initData: string;
        initDataUnsafe: {
          user?: { id: number; first_name: string; username?: string };
          start_param?: string;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          onClick(fn: () => void): void;
          offClick(fn: () => void): void;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          showProgress(leaveActive: boolean): void;
          hideProgress(): void;
        };
      };
    };
  }
}

export function useTelegram() {
  const webApp = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  const isTelegram = !!(webApp?.initData);
  return {
    isTelegram,
    webApp: isTelegram ? webApp! : null,
    startParam: webApp?.initDataUnsafe?.start_param ?? null,
  };
}
