---
description: >-
  Key Digital Functionalities describe the core (required) functions that this
  Building Block must be able to perform.
---

# 4 Key Digital Functionalities

The functional requirements of the Identity Building Block cover the full life cycle or a Foundational ID so as the services offered to use that Identity. The Identity Building Block must offer functionalities to onboard new individuals, update and manage the life cycle of personal data, issue unique identifiers, issue physical or digital credentials, publish identity change events, and offer services to verify identity.

The Identity Build Block must have any response data payload it returns through its API only in the form of JSON or YAML formatted datasets. It is left to the application consuming the response to present it appropriately (e.g. as an Event list or calendar) and provision for associated user interface interactions.

The Identitity Building Block must enable usage from the following actors:

* "BB\_Admin" who manages this Building Block to run efficiently in a hosted environment;
* "Partners" who get registered and can obtain access to services after authorization ;
* "Users" who will manage their Identity information, access to this information by third parties, credentials and preferences;
* "Subscribers" will be notified of identity change events after registration.

The internal storage of the Identity Building Block must hold the configuration, status, and logged information of all scheduled events. It must also maintain a repository of details of Partners, Users and Subscribers. The Key digital functionalities that are considered within the current scope of the specifications are listed below:

## 4.2 Core Services

This section provides a description of the Key Functionalities for each of the core services of the Identity Building Block that was described in Section 2.

### **4.2.1 Identity Usage**

Registered and Authorized Partners have access to Identity Building Block Usage APIs to request Authentication of Users, if successful they can collect personal information after a User informed consent is given. For a specific Partner and a specific User, the Identity Building Block will produce a unique and repeatable Partner Specific User Token (PSUT).

### 4.2.2 Enrollment services

Enrollment services exposes API to on-board new identities, this API is to be used by registration systems that may vary in their form and technologies, this API is there to receive the raw data in a predefined format.

* The enrollment service will need to evaluate the identity related claims based on the registration data (e.g. differentiating between self-asserted or vouched for data in comparison to data coming from an authoritative source (such as a CRVS system). Depending on the context, some of this data (and meta-data) might need to be archived for audit purposes or to allow for repeated anti-fraud checks (e.g. data from an authoritative source was used but subsequently was reported lost / stolen). As this meta-data forms the basis of the resulting identity service, only identity-specific data needs to be stored in the live system, with meta-data being held separately (and under additional security controls).
* Enrollment services may be designed to be permissive, i.e. allowing for enrollment based on partial / poor quality data dependent on the context.
* Those data need to be traceable and auditable so they should come in with all evidence and capture contextual meta-data, but should not permit tracking of such without evidence of permission (declarative process)

### 4.2.3 Credential Management Services

Credential Management Services exposes an API to get access and update the credential associated to the identity, also manage issuance and life-cycle of credentials whatever physical or digital.

### 4.2.4 Identity and Verification Services

Identity and Verification Services expose APIs to offer identification services to the 3rd party players . Those services can be: identity verification, attributes sharing or answers to claims (ie I claim I’m older than 18 years old) Usage can be multiple in public services, but also private, even cross-countries. They can be based on identity attributes : text, biometrics, also known documents and even on what people know (PIN code, Passport) or what they own (smartphone with SIM card)

### 4.2.5 Notifications Services

Notification Services expose APIs which allow triggering of external processes according to events happening on the identity data managed by the identity system (ie name change, death, new child born, document lost or stolen, etc.) In order to preserve privacy and respect the principle of single source of truth, the notification should only mention an identity change event to a set of subscribers for them to be aware they may need to refresh a right or create a new record in their system (ie: a birth may generate change in households register of social security and or person reaching 60 may be allowed to retirement pension)

### 4.2.6 Federations Services

Federation Services expose APIs allowing federation of identities from external identity providers. Indeed, individuals may already have an existing form of digital identity they need to keep using and would like to associate with their national identity. In that case the Federation services will be able to attach those forms of identity based on their identifier to their national identity managed by IDV BB, also to allow delegation to them of individual’s authentication.

Registered and Authorized Partners have access to Identity Building Block Usage APIs to request Authentication of Users, if successful they can collect personal information after a User informed consent is given. For a specific Partner and a specific User, the Identity Building Block will produce a unique and repeatable Partner Specific User Token (PSUT).

## **4.2 Identity Management**

New Users can be on-boarded following an Enrollment process, this process can be composed of one or several steps with data coming from one or multiple sources. Once a new identity has been registered a Unique Identifier will be generated for further representing the User in the GovStack. For privacy purposes, this Unique Identifier will be kept secret inside the Identity Management system, and tokens (randomly generated identifiers) or aliases (existing identifiers) will be linked to it and shared with the User for further involvement in the Usage APIs or for the Credential management. User Interfaces and APIs will allow a user to have a management of its personal data for CRUD requests (Create, Read, Update, Delete) according to GDPR regulation and to the Adopting Country laws, policies and practices. A User will have the possibility to generate a temporary and revokable Virtual ID to preserve its privacy for temporary use. A User will have the possibility to link an existing personal identifier for leveraging on existing forms of trusted ID (i.e. ID Card Number, Passport Number, Phone Number, e-mail address, etc.) this identifier will be usable within ID Usage services.

## **4.3 Credential Management**

A User will have the possibility to generate Credentials containing a set of claims, being personal attributes or declarations (i.e. I am an adult). Those credentials will be possible to be issued in the form of Verifiable Credentials (World Wide Web Consortium, International Civil Aviation Organization, or mobile driving license), with the objective to be readable and verifiable against the issuer by a third party. Credentials may have a limited lifetime or not and could be limited to usage by specific partners. Identity Building Block would allow a user to suspend (temporarily) or revoke (definitely) a Credential which then would become unusable with the Usage APIs. A User could obtain physical forms of Credentials printed on a physical support (card, paper, etc.), the information printed on the credential would be shared as a verifiable Credential to ensure backward trustability of the information, and the Physical Credential layout could be generated by the Identity Building Block in a PDF format for a further printing by a credential printing partner. An API would be available to search, authenticate and manage the credentials of a specific User.

## **4.4 Subscription Management**

Partners will have the possibility to register for Identity-related events for being notified when they will happen. Identity-related events being the creation of identity (new User on-boarded, could be birth registered or a new user registered), update in one or several of the identity personal attributes, or event happening to that identity (i.e. death, disappearance) Subject to preliminary authorization, Partners could register to type of events applicable to all Users, or to specific Users or using filters on some attributes (i.e. age reaching 18) When an event will occur the Identity Building Block will send a notification to the registered partners, then the partner will be in the capacity to request Identity Building Block event-related information.

## **4.5 Administration Management**

GovStack administrators will have functionalities to configure the Identity Building Block from a central place.