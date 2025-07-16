---
description: >-
  This section will highlight important requirements or describe any additional
  cross-cutting requirements that apply to this Building Block.
---

# 5 Cross-Cutting Requirements

## 5.1 Requirements

The Cross-cutting requirements described in this section are an extension of the cross-cutting requirements defined in the [Security Requirements](https://govstack.gitbook.io/specification/v/1.0/security-requirements).

## 5.1.1 Enrollment Services (REQUIRED)

Enrollment services for a digital ID in the form of a certificate using the physical credentials of the enrollee (a human citizen subject) and the process of the Identity Building Block (see the functional requirements for Identity in the Identity Building Block Definition). A feature for invalidating, locking or disenrollment/revocation of the digital ID shall also be provided as a response measure to both human citizen subjects leaving the system and responding to security breaches encountered. Digital certificate enrollment must be provided by the solution but is not required for every human citizen subject (see below). Notes:

* It is anticipated that the Identity Building Block will call this feature either directly via API or indirectly via the IAM features of the Security Building Block for users electing to use an electronic ID consisting of certificates as a part of the account provisioning process. The digital ID will then be stored with the physical ID records in the identity Building Block and sent to the new user via secure means (probably installed on their device).
* Simple numerical digital IDs will also be supported for human citizen subjects as an option where users are unable to leverage certificates-based digital IDs. The requirements governing this are to be stipulated by the Identity Building Block (see the Identity Building Block Definition).
* Third-party organizations and internal subjects (both human and non-human) must be issued valid signed digital certificates in order to establish and maintain secure inter-organization and internal communications.

## 5.1.2 Multi-Factor Authentication (REQUIRED)

The overall solution suite shall also be able to implement multi-factor authentication using simple numeric digital IDs for human citizen subjects such as their tax file or social security number of the user.

A selection of various alternatives for digital ID is required in order to cater for more or less digitally-savvy citizens. Various token types are also required to be optimally supported such as HOTP and TOTP tokens, SMS, email, push notifications, SSH keys, X.509 certificates, Yubikeys, Nitrokeys, U2F and WebAuthn. Vendors of solutions SHOULD articulate the benefits of what they propose in their solution.

Note that multi-factor authentication must be able to be implemented for both external and internal subjects (people, systems, components etc.) but is not necessarily required for internal non-human subjects (such as building block components) as they communicate via the information mediator Building Block (see the Information Mediation Building Block Definition).

## 5.1.3 Numerical Digital ID Attribute (REQUIRED)

Where human citizen subjects adopt the use of a simple numerical digital ID, the multi-factor authentication process MUST include a time-sensitive credential (AKA OTP or one-time PIN).

## 5.2 Consent Management <a href="#docs-internal-guid-da47132b-7fff-3138-7667-f87bd4540eb3" id="docs-internal-guid-da47132b-7fff-3138-7667-f87bd4540eb3"></a>

Whilst ID and Verification as defined and understood in this Building Block should be supported by local or supranational laws and regulations (like internal security or global AML rules), translation of the appropriate use, in reality, is complex and hardly enforceable.

Hence, we recommend that any solution should have a defined consent management mechansîsm by design.

The specifications for such mechanisms but should follow the following requirements:

1. Consent should be created in the context of the user and should be available to the user.
2. Take consideration of consent receipts ([Kantara Initiative Releases the First Open, Global Consent Receipt Specification](https://kantarainitiative.org/kantara-initiative-releases-first-open-global-consent-receipt-specification/))
3. Following the logic that a user is asked to give consent for a particular activity/data share. (Some other system linking the user with the activity). Assuming that the overall system sends the consent request to the appropriate user then their response (I give consent) is stored and managed in the consent management Building Block or any other responsible party). If the user is a mother who does not yet have a registered identity they can still be the 'person' who is asked for their consent.
4. Address ownership of register and access questions: presumably, the consent register is only held by the data controller who is acting on the basis of the consent.
5. Purpose limitation of the consent.
6. A request-response approach or a link to a transaction ID and parties and dates would also help.
7. An assisted model would also be required, where 3rd party agencies can come in to collect consent from the user.
8. Apart from technical requirements, it is helpful to differentiate between consent as an ethical process versus consent as a legal basis for processing personal data (certainly under GDPR).

Identity Building Block implement a Consent collection mechanism in order to be aligned with the open-standard openID Connect. This consent collection ensure an authentic approval of an individual before sharing its PII (Personal Identifiable Information), as the the individual is authenticated as a first step.

In future releases, after a proper study being done, the Identity Building Block would integrate with the Consent Building Block to leverage the storing and verification features, together with the standardization brought by Consent Building Block.

## 5.3 Trust Framework

Trust Frameworks can be considered a mechanism to enable the trusted exchange of information between sovereign partners. The Trust Framework is a much-discussed concept and this report recommends including the specifications in the second iteration as a sub-Building Block whereby additional experts should be included.

## 5.4 Standards

The following standards are applicable to data structures in the Identity Building Block: