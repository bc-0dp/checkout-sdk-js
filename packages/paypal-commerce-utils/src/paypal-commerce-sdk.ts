import { ScriptLoader } from '@bigcommerce/script-loader';

import {
    MissingDataError,
    MissingDataErrorType,
    PaymentMethod,
    PaymentMethodClientUnavailableError,
} from '@bigcommerce/checkout-sdk/payment-integration-api';

import {
    PayPalAxoSdk,
    PayPalCommerceHostWindow,
    PayPalCommerceInitializationData,
    PayPalFastlaneSdk,
    PayPalMessagesSdk,
    PayPalSdkConfig,
} from './paypal-commerce-types';

export default class PayPalCommerceSdk {
    private window: PayPalCommerceHostWindow;

    constructor(private scriptLoader: ScriptLoader) {
        this.window = window;
    }

    // TODO: remove this method when PPCP Fastlane experiment will be rollout to 100%
    async getPayPalAxo(
        paymentMethod: PaymentMethod<PayPalCommerceInitializationData>,
        currencyCode: string,
    ): Promise<PayPalAxoSdk> {
        if (!this.window.paypalAxo) {
            const paypalSdkConnectConfig = this.getPayPalSdkConnectConfiguration(
                paymentMethod,
                currencyCode,
            );

            await this.loadPayPalSdk(paypalSdkConnectConfig);

            if (!this.window.paypalAxo) {
                throw new PaymentMethodClientUnavailableError();
            }
        }

        return this.window.paypalAxo;
    }

    async getPayPalFastlaneSdk(
        paymentMethod: PaymentMethod<PayPalCommerceInitializationData>,
        currencyCode: string,
    ): Promise<PayPalFastlaneSdk> {
        if (!this.window.paypalFastlaneSdk) {
            const config = this.getPayPalFastlaneSdkConfiguration(paymentMethod, currencyCode);

            await this.loadPayPalSdk(config);

            if (!this.window.paypalFastlaneSdk) {
                throw new PaymentMethodClientUnavailableError();
            }
        }

        return this.window.paypalFastlaneSdk;
    }

    async getPayPalMessages(
        paymentMethod: PaymentMethod<PayPalCommerceInitializationData>,
        currencyCode: string,
    ): Promise<PayPalMessagesSdk> {
        if (!this.window.paypalMessages) {
            const paypalSdkMessagesConfig = this.getPayPalSdkMessagesConfiguration(
                paymentMethod,
                currencyCode,
            );

            await this.loadPayPalSdk(paypalSdkMessagesConfig);

            if (!this.window.paypalMessages) {
                throw new PaymentMethodClientUnavailableError();
            }
        }

        return this.window.paypalMessages;
    }

    /**
     *
     *  loadPayPalSdk is a paypal sdk script loader
     *  which loads paypal sdk based on provided configuration
     *
     */
    private async loadPayPalSdk({ options, attributes }: PayPalSdkConfig): Promise<void> {
        const scriptOptions = this.transformConfig<PayPalSdkConfig['options']>(options);
        const scriptAttributes = this.transformConfig<PayPalSdkConfig['attributes']>(attributes);

        const paypalSdkUrl = 'https://www.paypal.com/sdk/js';
        const scriptQuery = new URLSearchParams(scriptOptions).toString();
        const scriptSrc = `${paypalSdkUrl}?${scriptQuery}`;

        await this.scriptLoader.loadScript(scriptSrc, {
            async: true,
            attributes: scriptAttributes,
        });
    }

    /**
     *
     * Configurations section
     *
     */
    // TODO: remove this method when PPCP Fastlane experiment will be rolled out to 100%
    private getPayPalSdkConnectConfiguration(
        paymentMethod: PaymentMethod<PayPalCommerceInitializationData>,
        currencyCode: string,
    ): PayPalSdkConfig {
        const { clientToken, initializationData } = paymentMethod;

        if (!initializationData || !initializationData.clientId) {
            throw new MissingDataError(MissingDataErrorType.MissingPaymentMethod);
        }

        const {
            intent,
            clientId,
            merchantId,
            attributionId,
            connectClientToken, // TODO: remove when PPCP AXO A/B testing will be finished
        } = initializationData;

        // TODO: remove ts-ignore when typescript version will be 4.6+
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const clientMetadataId = crypto.randomUUID().replace(/-/g, '');

        return {
            options: {
                'client-id': clientId,
                'merchant-id': merchantId,
                commit: true,
                components: ['connect'],
                currency: currencyCode,
                intent,
            },
            attributes: {
                'data-client-metadata-id': clientMetadataId,
                'data-namespace': 'paypalAxo',
                'data-partner-attribution-id': attributionId,
                'data-user-id-token': connectClientToken || clientToken,
            },
        };
    }

    private getPayPalFastlaneSdkConfiguration(
        paymentMethod: PaymentMethod<PayPalCommerceInitializationData>,
        currencyCode: string,
    ): PayPalSdkConfig {
        const { clientToken, initializationData } = paymentMethod;

        if (!initializationData || !initializationData.clientId) {
            throw new MissingDataError(MissingDataErrorType.MissingPaymentMethod);
        }

        const {
            intent,
            clientId,
            merchantId,
            attributionId,
            connectClientToken, // TODO: remove when PPCP Fastlane A/B testing will be finished
        } = initializationData;

        // TODO: remove ts-ignore when typescript version will be 4.6+
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const clientMetadataId = crypto.randomUUID().replace(/-/g, '');

        return {
            options: {
                'client-id': clientId,
                'merchant-id': merchantId,
                commit: true,
                components: ['fastlane'],
                currency: currencyCode,
                intent,
            },
            attributes: {
                'data-client-metadata-id': clientMetadataId,
                'data-namespace': 'paypalFastlane',
                'data-partner-attribution-id': attributionId,
                'data-user-id-token': connectClientToken || clientToken,
            },
        };
    }

    private getPayPalSdkMessagesConfiguration(
        paymentMethod: PaymentMethod<PayPalCommerceInitializationData>,
        currencyCode: string,
    ): PayPalSdkConfig {
        const { clientToken, initializationData } = paymentMethod;

        if (!initializationData || !initializationData.clientId) {
            throw new MissingDataError(MissingDataErrorType.MissingPaymentMethod);
        }

        const { clientId, merchantId, attributionId } = initializationData;

        return {
            options: {
                'client-id': clientId,
                'merchant-id': merchantId,
                components: ['messages'],
                currency: currencyCode,
            },
            attributes: {
                'data-namespace': 'paypalMessages',
                'data-partner-attribution-id': attributionId,
                'data-user-id-token': clientToken,
            },
        };
    }

    /**
     *
     * Utils methods
     *
     */
    private transformConfig<T extends Record<string, unknown>>(config: T): Record<string, string> {
        let transformedConfig = {};

        const keys = Object.keys(config) as Array<keyof T>;

        keys.forEach((key) => {
            const value = config[key];

            if (
                value === undefined ||
                value === null ||
                value === '' ||
                (Array.isArray(value) && value.length === 0)
            ) {
                return;
            }

            transformedConfig = {
                ...transformedConfig,
                [key]: Array.isArray(value) ? value.join(',') : value,
            };
        });

        return transformedConfig;
    }
}
