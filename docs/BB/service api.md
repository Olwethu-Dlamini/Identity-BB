---
description: >-
  This section provides a reference for APIs that should be implemented by this
  Building Block.
---

# 8 Service APIs

The APIs defined here establish a blueprint for how the Building Block will interact with other Building Blocks. Additional APIs may be implemented by the Building Block, but the listed APIs define a minimal set of functionality that should be provided by any implementation of this Building Block.

In common for all services of the Identity Building Block, the API expects the calling Partner has been already authenticated and authorized to access the service. For detailed specifications of APIs with input/output formats please refer to API specifications defined in YAML in the corresponding GitHub repository.

The [GovStack non-functional requirements document](https://govstack.gitbook.io/specification/v/1.0/architecture-and-nonfunctional-requirements/6-onboarding) provides additional information on how 'adaptors' may be used to translate an existing API to the patterns described here. This section also provides guidance on how candidate products are tested and how GovStack validates a product's API against the API specifications defined here.

The tests for the Identity Building Block can be found in [this GitHub repository](https://github.com/GovStackWorkingGroup/bb-identity/tree/main/test/openAPI).

## API standards <a href="#heading-h.3o7alnk" id="heading-h.3o7alnk"></a>

* The microservice interfaces are defined as per [OPENAPI Ver3.0 standards](https://swagger.io/specification/).
* For implementation purposes, it is suggested to refer [TMF630\_REST\_API\_Design\_Guidelines](https://www.tmforum.org/resources/standard/tmf630-rest-api-design-guidelines-4-2-0/).

## 8.1 Identity Usage

The Identity usage APIs are a set of OpenAPI specifications exposed by the Identity Building Block to other building blocks and applications for user verification.

The Identity usage APIs are based on the following principles:

* Verification APIs are inspired from OpenID Connect protocol which simplifies integrations using pre-existing libraries
* Only secure options in OpenID connect should be supported to ensure the user data is handled securely
* All biometric capture for user verification should be done using [Secure Biometrics Interface standards](https://standards.ieee.org/ieee/3167/10925/)

#### Service Group: Client Management

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/client-mgmt/oidc-client" method="post" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/client-mgmt/oidc-client/{client_id}" method="put" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/authorize" method="get" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/oauth/token" method="post" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/oidc/userinfo" method="get" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/.well-known/jwks.json" method="get" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/.well-known/openid-configuration" method="get" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

For Identity Building Block implementations that support mobile wallet integration, the following API spec should also be implemented.

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/linked-authorization/link-code" method="post" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/linked-authorization/link-status" method="post" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/linked-authorization/link-auth-code" method="post" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/linked-authorization/link-transaction" method="post" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/linked-authorization/authenticate" method="post" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/linked-authorization/consent" method="post" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

{% openapi src="https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml" path="/wallet-binding" method="post" %}
[https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml](https://raw.githubusercontent.com/GovStackWorkingGroup/bb-identity/main/api/Identity-Provider.yaml)
{% endopenapi %}

Detailed API schemas written in YAML that define REST API endpoints for each of the services mentioned above are available on GitHub located at the [Identity-Provider YAML](https://github.com/GovStackWorkingGroup/bb-identity/blob/23Q4.1/api/Identity-Provider.yaml).

The [GovStack non-functional requirements document](https://govstack.gitbook.io/specification/v/1.0/architecture-and-nonfunctional-requirements/6-onboarding) provides additional information on how 'adaptors' may be used to translate an existing API to the patterns described here.

## 8.2 Identity Management

The Enrollment APIs are a set of OpenAPI specifications exposed by the Identity Building Block ‘Enrollment Server’ service to any enrollment client.

The Enrollment APIs are based on the following principles:

* When enrollment is done in one step, the CreateEnrollment can contain all the data and an additional flag (finalize) to indicate all data was collected.
* During the process, the enrollment structure can be updated. Only the data that changed need to be transferred. Data not included is left unchanged on the server. In the following example, the biographic data is not changed.
* Images can be passed by value or reference.
* Existing standards are used whenever possible, for instance, the preferred image format for biometric data is **ISO-19794**. The underlying data should be of open mime types that offer good compression without loss of data (for example JPEG2000 for images).

{% openapi src="https://3457543697-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FWxDGFK8JvbnWnN3kch5n%2Fuploads%2Fgit-blob-35b763af7685a4d8a816af1cc8c54fbf7b7f6373%2Fenrollment%20(3).yaml?alt=media" path="/enrollment" method="put" %}
[enrollment (3).yaml](https://3457543697-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FWxDGFK8JvbnWnN3kch5n%2Fuploads%2Fgit-blob-35b763af7685a4d8a816af1cc8c54fbf7b7f6373%2Fenrollment%20\(3\).yaml?alt=media)
{% endopenapi %}

## **8.3 Credential Management**

This Services APIs is not yet specified, but it should be the purpose of a next iteration of the Identity Building Block Specification.

## **8.4 Subscription Management**

This Services APIs is not yet specified, but it should be the purpose of a next iteration of the Identity Building Block Specification.

## **8.5 Administration Management**

This Services APIs is not yet specified, but it should be the purpose of a next iteration of the Identity Building Block Specification.