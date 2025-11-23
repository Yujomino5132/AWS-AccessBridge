/* eslint-disable @typescript-eslint/no-explicit-any */

import { GenerateConsoleUrlRoute as OriginalGenerateConsoleUrlRoute } from './api/aws/console/POST';
import { AssumeRoleRoute as OriginalAssumeRoleRoute } from './api/aws/assume-role/POST';
import { FederateRoute as OriginalFederateRoute } from './api/aws/federate/GET';
import { ListAssumablesRoute as OriginalListAssumablesRoute } from './api/user/assumables/GET';
import { GetCurrentUserRoute as OriginalGetCurrentUserRoute } from './api/user/me/GET';
import { FavoriteAccountRoute as OriginalFavoriteAccountRoute } from './api/user/favorites/POST';
import { UnfavoriteAccountRoute as OriginalUnfavoriteAccountRoute } from './api/user/favorites/DELETE';
import { RotateMasterKeyRoute as OriginalRotateMasterKeyRoute } from './api/admin/crypto/rotate-master-key/POST';
import { StoreCredentialRoute as OriginalStoreCredentialRoute } from './api/admin/credentials/store-credential/POST';

export const GenerateConsoleUrlRoute: any = OriginalGenerateConsoleUrlRoute;
export const AssumeRoleRoute: any = OriginalAssumeRoleRoute;
export const FederateRoute: any = OriginalFederateRoute;
export const ListAssumablesRoute: any = OriginalListAssumablesRoute;
export const GetCurrentUserRoute: any = OriginalGetCurrentUserRoute;
export const FavoriteAccountRoute: any = OriginalFavoriteAccountRoute;
export const UnfavoriteAccountRoute: any = OriginalUnfavoriteAccountRoute;
export const RotateMasterKeyRoute: any = OriginalRotateMasterKeyRoute;
export const StoreCredentialRoute: any = OriginalStoreCredentialRoute;
