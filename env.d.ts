declare module 'axios/lib/defaults' {
  export default {};
}

declare module 'axios/lib/core/mergeConfig' {
  import { AxiosRequestConfig } from 'axios';
  function mergeConfig(
    defaultConfig: AxiosRequestConfig,
    instanceConfig?: AxiosRequestConfig
  ): AxiosRequestConfig;

  export default mergeConfig;
}
