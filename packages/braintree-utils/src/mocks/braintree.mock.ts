import { PaymentMethod } from '@bigcommerce/checkout-sdk/payment-integration-api';

import {
    BraintreeClient,
    BraintreeConnect,
    BraintreeConnectAuthenticationState,
    BraintreeConnectProfileData,
    BraintreeDataCollector,
    BraintreeModule,
    BraintreeModuleCreator,
    BraintreePaypal,
    BraintreePaypalCheckout,
    BraintreePaypalCheckoutCreator,
    BraintreeShippingAddressOverride,
    BraintreeThreeDSecure,
    BraintreeTokenizePayload,
    GooglePayBraintreePaymentDataRequestV1,
    GooglePayBraintreeSDK,
    LocalPaymentInstance,
    TotalPriceStatusType,
} from '../braintree';

export function getClientMock(): BraintreeClient {
    return {
        request: jest.fn(),
        getVersion: jest.fn(),
    };
}

export function getBraintree(): PaymentMethod {
    return {
        id: 'braintree',
        clientToken: 'clientToken',
        logoUrl:
            'https://cdn.bcapp.dev/rHEAD/modules/checkout/braintree/images/paypal_powered_braintree_horizontal.png',
        method: 'credit-card',
        supportedCards: ['VISA', 'MC', 'AMEX', 'DISCOVER', 'JCB', 'DINERS'],
        config: {
            displayName: 'Credit Card',
            cardCode: true,
            enablePaypal: true,
            merchantId: '',
            testMode: true,
            isVisaCheckoutEnabled: false,
        },
        initializationData: {
            isAcceleratedCheckoutEnabled: false,
            paymentButtonStyles: {
                checkoutTopButtonStyles: {
                    color: 'blue',
                    label: 'checkout',
                },
            },
        },
        type: 'PAYMENT_TYPE_API',
    };
}

export function getBraintreeConnectProfileDataMock(): BraintreeConnectProfileData {
    return {
        connectCustomerAuthAssertionToken: 'some_token',
        connectCustomerId: 'asdasd',
        addresses: [
            {
                id: '123123',
                company: undefined,
                extendedAddress: undefined,
                firstName: 'John',
                lastName: 'Doe',
                streetAddress: 'Hello World Address',
                locality: 'Bellingham',
                region: 'WA',
                postalCode: '98225',
                countryCodeNumeric: 0,
                countryCodeAlpha2: 'US',
                countryCodeAlpha3: '',
            },
        ],
        cards: [
            {
                id: 'pp-vaulted-instrument-id',
                paymentSource: {
                    card: {
                        brand: 'VISA',
                        expiry: '02/2037',
                        lastDigits: '1111',
                        billingAddress: {
                            id: '321',
                            company: undefined,
                            extendedAddress: undefined,
                            firstName: undefined,
                            lastName: undefined,
                            streetAddress: 'Hello World Address',
                            locality: 'Bellingham',
                            region: 'WA',
                            postalCode: '98225',
                            countryCodeNumeric: 0,
                            countryCodeAlpha2: 'US',
                            countryCodeAlpha3: '',
                        },
                    },
                },
            },
        ],
        name: {
            given_name: 'John',
            surname: 'Doe',
        },
        phones: [
            {
                country_code: '1',
                national_number: '4085551234',
            },
        ],
    };
}

export function getConnectMock(): BraintreeConnect {
    return {
        identity: {
            lookupCustomerByEmail: () => Promise.resolve({ customerContextId: 'customerId' }),
            triggerAuthenticationFlow: () =>
                Promise.resolve({
                    authenticationState: BraintreeConnectAuthenticationState.SUCCEEDED,
                    profileData: getBraintreeConnectProfileDataMock(),
                }),
        },
        ConnectCardComponent: jest.fn(),
        events: {
            apmSelected: jest.fn(),
            emailSubmitted: jest.fn(),
            orderPlaced: jest.fn(),
        },
    };
}

export function getDataCollectorMock(): BraintreeDataCollector {
    return {
        deviceData: getDeviceDataMock(),
        teardown: jest.fn(() => Promise.resolve()),
    };
}

export function getBraintreeLocalPaymentMock(): LocalPaymentInstance {
    return {
        startPayment: jest.fn(
            (_options: unknown, onPaymentStart: (payload: { paymentId: string }) => void) => {
                onPaymentStart({ paymentId: '123456' });
            },
        ),
        teardown: jest.fn(() => Promise.resolve()),
    };
}

export function getDeviceDataMock(): string {
    return '{"device_session_id": "my_device_session_id", "fraud_merchant_id": "we_dont_use_this_field"}';
}

export function getModuleCreatorMock<T>(
    module?: BraintreeModule | BraintreeClient | BraintreeConnect | BraintreePaypal,
): BraintreeModuleCreator<T> {
    return {
        create: jest.fn(() => Promise.resolve(module || {})),
    };
}

export function getPaypalCheckoutMock(): BraintreePaypalCheckout {
    return {
        loadPayPalSDK: jest.fn((_config, callback: () => void) => callback()),
        createPayment: jest.fn(() => Promise.resolve()),
        teardown: jest.fn(),
        tokenizePayment: jest.fn(() => Promise.resolve(getTokenizePayload())),
    };
}

export function getPayPalCheckoutCreatorMock(
    braintreePaypalCheckoutMock: BraintreePaypalCheckout,
    shouldThrowError: boolean,
): BraintreePaypalCheckoutCreator {
    return {
        create: shouldThrowError
            ? jest.fn(
                  (
                      _config,
                      callback: (
                          err: Error,
                          braintreePaypalCheckout: BraintreePaypalCheckout | undefined,
                      ) => void,
                  ) => callback(new Error('test'), undefined),
              )
            : jest.fn(
                  (
                      _config,
                      callback: (
                          _err: Error | undefined,
                          braintreePaypalCheckout: BraintreePaypalCheckout,
                      ) => void,
                  ) => callback(undefined, braintreePaypalCheckoutMock),
              ),
    };
}

export function getTokenizePayload(): BraintreeTokenizePayload {
    return {
        nonce: 'NONCE',
        type: 'PaypalAccount',
        details: {
            email: 'foo@bar.com',
            payerId: 'PAYER_ID',
            firstName: 'Foo',
            lastName: 'Bar',
            billingAddress: {
                line1: '56789 Testing Way',
                line2: 'Level 2',
                city: 'Some Other City',
                state: 'Arizona',
                countryCode: 'US',
                postalCode: '96666',
            },
            shippingAddress: {
                recipientName: 'Hello World',
                line1: '12345 Testing Way',
                line2: 'Level 1',
                city: 'Some City',
                state: 'California',
                countryCode: 'US',
                postalCode: '95555',
            },
        },
    };
}

export function getGooglePayMock(): GooglePayBraintreeSDK {
    return {
        createPaymentDataRequest: jest.fn(() => getBraintreePaymentDataRequest()),
        teardown: jest.fn(),
    };
}

export function getBraintreePaypalMock(): BraintreePaypal {
    return {
        closeWindow: jest.fn(),
        focusWindow: jest.fn(),
        tokenize: jest.fn(() => Promise.resolve(getBraintreePaypalTokenizePayloadMock())),
        Buttons: jest.fn(() => ({
            render: jest.fn(),
            isEligible: jest.fn(() => true),
        })),
    };
}

export function getBraintreePaypalTokenizePayloadMock(): BraintreeTokenizePayload {
    return {
        nonce: 'nonce',
        type: 'PaypalAccount',
        details: {
            email: 'test@test.com',
        },
    };
}

export function getBraintreePaypal(): PaymentMethod {
    return {
        id: 'braintreepaypal',
        logoUrl: '',
        method: 'paypal',
        supportedCards: [],
        config: {
            testMode: false,
        },
        type: 'PAYMENT_TYPE_API',
        clientToken: 'foo',
        initializationData: {
            isBrainteeVenmoEnabled: false,
            enableCheckoutPaywallBanner: false,
        },
    };
}

export function getThreeDSecureMock(): BraintreeThreeDSecure {
    return {
        verifyCard: jest.fn(),
        cancelVerifyCard: jest.fn(),
        teardown: jest.fn(() => Promise.resolve()),
    };
}

export function getBraintreePaymentDataRequest(): GooglePayBraintreePaymentDataRequestV1 {
    return {
        allowedPaymentMethods: [],
        apiVersion: 1,
        cardRequirements: {
            allowedCardNetworks: [],
            billingAddressFormat: '',
            billingAddressRequired: true,
        },
        environment: '',
        i: {
            googleTransactionId: '',
            startTimeMs: 1,
        },
        merchantInfo: {
            authJwt: '',
            merchantId: '',
            merchantName: '',
        },
        paymentMethodTokenizationParameters: {
            parameters: {
                'braintree:apiVersion': '',
                'braintree:authorizationFingerprint': '',
                'braintree:merchantId': '',
                'braintree:metadata': '',
                'braintree:sdkVersion': '',
                gateway: '',
            },
            tokenizationType: '',
        },
        shippingAddressRequired: true,
        phoneNumberRequired: true,
        transactionInfo: {
            currencyCode: '',
            totalPrice: '',
            totalPriceStatus: TotalPriceStatusType.FINAL,
        },
    };
}

export function getBraintreeAddress(): BraintreeShippingAddressOverride {
    return {
        line1: '12345 Testing Way',
        line2: '',
        city: 'Some City',
        state: 'CA',
        countryCode: 'US',
        postalCode: '95555',
        phone: '555-555-5555',
        recipientName: 'Test Tester',
    };
}
