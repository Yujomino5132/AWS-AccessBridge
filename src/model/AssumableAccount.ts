interface AssumableAccount {
  roles: string[];
  nickname?: string;
  favorite: boolean;
}

type AssumableAccountsMap = Record<string, AssumableAccount>;

export type { AssumableAccount, AssumableAccountsMap };
