/* eslint-disable @typescript-eslint/no-explicit-any */

import { GenerateConsoleUrlRoute as OriginalGenerateConsoleUrlRoute } from './api/aws/console/POST';
import { AssumeRoleRoute as OriginalAssumeRoleRoute } from './api/aws/assume-role/POST';
import { ListAssumablesRoute as OriginalListAssumablesRoute } from './api/user/assumables/GET';
import { GetCurrentUserRoute as OriginalGetCurrentUserRoute } from './api/user/me/GET';
import { RotateMasterKeyRoute as OriginalRotateMasterKeyRoute } from './api/admin/crypto/rotate-master-key/POST';

export const GenerateConsoleUrlRoute: any = OriginalGenerateConsoleUrlRoute;
export const AssumeRoleRoute: any = OriginalAssumeRoleRoute;
export const ListAssumablesRoute: any = OriginalListAssumablesRoute;
export const GetCurrentUserRoute: any = OriginalGetCurrentUserRoute;
export const RotateMasterKeyRoute: any = OriginalRotateMasterKeyRoute;

export { IActivityAPIRoute } from './IActivityAPIRoute';
export type { IRequest, IResponse, IEnv, ActivityContext } from './IActivityAPIRoute';
