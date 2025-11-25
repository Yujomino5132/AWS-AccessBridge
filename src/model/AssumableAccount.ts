interface AssumableAccount {
  roles: string[];
  nickname?: string | undefined;
  favorite?: boolean | undefined;
}

type AssumableAccountsMap = Record<string, AssumableAccount>;

export type { AssumableAccount, AssumableAccountsMap };
