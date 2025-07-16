---
description: This section provides context for this Building Block.
---

# 2 Description

The purpose of this document is to be the reference specification of the Identity Building Block, describing its internal architecture, its external interfaces, and how it is expected to interact with other Building Blocks.

The Identity Block creates, manages, and uses a digital foundational identity (functional identity is not in the scope of this document). As a part of the overall identity system, it can be interfaced with other Building Blocks in order to realize the complete set of requirements necessary for the delivering identification services and managing lifecycle of Foundational Identities.

The Identity Building Block is composed of a set of interoperable sub-components/modules dedicated to the management of the foundational identity offering different services for ensuring a trusted foundational identity for enabling related use cases.

The guidance from this Building Block takes note of recognized approaches across the globe which in detail and deployment can vary greatly. These approaches will consider central, federated, and distributed (decentralized) models, the Identity Building block will remain approach agnostic and flexible for being capable to adapt to the different policies and existing countries that can exists in adopting countries. This version of the document is focused on centralized approach already taking into account integration with Functional Identity, therefore covering the federated approach. Fully distributed approach (decentralized identity issuance or self-issuance) is not yet covered yet .

## 2.1 Centralized, Federated, Distributed Identities

Identity systems can follow different approaches between centralized, federated or distributed identities.

* With the **Centralized Identity** approach, the identity is managed in a unique central place and offered as a service to the systems around. Foundational Identity follows a Centralized approach.
* With the **Federated Identity** approach, the identities are multiple and managed in different systems which are all trusted to ensure identity verification services. Federated systems may be functional systems which could include different characteristics of persons. This approach helps to leverage existing identity assets. In a federated identity approach the IDV BB could:
  * act as an Identity Provider and expose authentication services via federation (see Open ID Connect Standards).
  * offer services for identity proofing to external Identity Providers via the Identity Verification services standardized interfaces.
* With the **Distributed Identity** approach (also named decentralized or self-sovereign identity), the identity is owned and managed by the end person in a form of credentials (physical or digital) for which the owner is in full or as-needed control of its usage. This model if compared to centralized to federated presents lots of benefits in terms of privacy protection.

In each of these approaches trust in the identity and verification needs to be established. The centralized and federated approaches have organizations that provide trust through their ID proofing process but trust in the organizations themselves needs to be evaluated. Federated is an early form of decentralization and establishes a web of trust. If the same is extended to include relying parties and other service providers who participate in identity proofing, a distributed model is being created.

The concept of federated and distributed identity approaches are not covered in this specification and will be explained in more detail in future iterations of the ID specification.

Overall, we advocates that regardless which approach is chosen, the data should always belong to the individual, but the level of control offered to them might vary based on features offered as well as the underlying needs. For example a population registry cannot "forget" a person and might not allow for that.

There is no one-fits-all solution and often a combination of those approaches enables most benefits.

## 2.2 Identity Building Block Overview

The diagram below shows the high level view of the Identity Building Block.

<figure><img src="https://3457543697-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FWxDGFK8JvbnWnN3kch5n%2Fuploads%2Fgit-blob-cc65b11892ff7de77bea307f5ba593b36836939e%2FScreen%20Shot%202023-06-20%20at%2011.43.56%20AM.png?alt=media" alt=""><figcaption></figcaption></figure>

The Identity Building Block offers a set of external services to the other building blocks

*   **Federation services** are there to federate and harmonize multiple identities, which is creating

    a link in between various digital identities that an individual may have.
* **Enrollment Services** allow to on-board new identities for individuals, which means collecting its personal identity data, evidence of them, biometrics.
* **ID/Credential Management Services** permit to issue and manage the life cycle of Identity credentials, those services will allow to issue identity documents, to manage their renewal, declare them as stolen.
* **Identity Verification Services** allow a service provider to verify an identity or some of its attributes, for example checking a person declared identity or verifying its age.
* **Notification Services** will allow a third party to subscribe to events occurring on identity and to receive notifications, useful to inform external functional building block when a person was born or has passed off so that the external system can take required actions.

_Note: these services are detailed in Section 4 (Key Digital Functionalities)_

The Identity Building Block also includes internal sub-building blocks/ modules, notably:

* **Identity Registry** is a system storing and managing the identities. It contains and manages all the data that might need to be collected (according to local laws and regulations) including demographic (ie name), biographics (ie age), portrait, known identifiers, known documents and can offer consultation or management services on them. As the system must be auditable, it must keep track of identity changes and keep evidence leading to those changes. Privacy and Data protection rules force us to carefully manage storage and access to data, by respecting specific data protection design rules (minimization, isolation, anonymization, ..) Generally speaking, countries apply privacy and data protection laws similar to European GDPR which impose to minimize data stored including in time and always performs informed consent of the individuals of their end usages. The registry should allow for portability of data from one solution to another. For this the registry should support open data formats as well as standards based data formats. This applies to biometric and biographic data. The module should also offer APIs for such data portability.
* **Identifier Management** module, managing identifiers assigned to identities. In case a Unique Identity Number (UIN) is used and is acting as ‘primary key’ of identity, it is recommended that such number does not contain any personally identifiable information and hence can be used and shared publicly. The UIN should also be non-revocable. There may also be a set of tokens or aliases identifiers to use the identity and, where required, to link to data in functional systems.
* **Biometric Services** which offer capacities to compare biometrics in between identities. Key use cases being 1:N search which consist in confirming unicity of a person by comparing its biometrics to all ones stored in the system, 1:1 search to confirm an identity by comparing biometrics data one to one. Those services may be asynchronous when an adjudication system is in place, an adjudication system being a human based decision workflow allowing operators to take decision on uniqueness or identities match based on candidates identified automatically by the biometric search system. Centralized databases of biometric scan introduce significant privacy risks, see, for example, [https://www.theguardian.com/global-development/2021/sep/07/the-taliban-are-showing-us-the-dangers-of-personal-data-falling-into-the-wrong-hands](https://www.theguardian.com/global-development/2021/sep/07/the-taliban-are-showing-us-the-dangers-of-personal-data-falling-into-the-wrong-hands). Biometric services also provide standard interfaces for managing biometric data for operations on biometric data such as conversion, compression, templatization, matching, segmentation and more.
* **Orchestrator** (optional but strongly recommended) is often embedded in the Identity system in order to run the control steps and actions required to build an identity. It’s recommended to use an internal workflow for that, which may lead to triggering an external workflow if, for example, required to launch additional actions after identity creation.
* Identity Provider can be part of Identity Building Block and provide reference identities for identity verification, it can be also optional when in a decentralized (or distributed) identity model.
* **UIN Generator**, allows to generate Unique Identity Numbers which are unique in the system. UIN Generator will follow predefined business rules for that generation and will make sure that a new generated number has never been already issued.

## 2.3 Identity System Components

The graphic below presents the overall view of the Identity System with its main components.

<figure><img src="https://3457543697-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FWxDGFK8JvbnWnN3kch5n%2Fuploads%2Fgit-blob-0e90c85e4073703589c643e2af2c0103e957a366%2FScreen%20Shot%202023-06-20%20at%2011.53.35%20AM.png?alt=media" alt=""><figcaption></figcaption></figure>

### 2.3.1 Specificity of the Identity Registration System

Identity Registration system must be understood as different from a classical application registration system, as it establishes a person’s foundational ID which is likely to act as a basis for their digital twin (digital twin is the equivalent of a physical real person in the digital realm) for all digital interactions and therefore will be of high importance for him/her as well as being highly attractive for hackers, demanding the highest level of security.

It might require secured biometrics and document capture capacities in order to limit the chance of fraud, although the use of biometrics is not recommended given the potential privacy implications. It can be compared at the entrance door of a secured site where security is particularly reinforced and the process takes necessary time to check all information, if compared to internal access control which can be lighter and based on short interactions. The Identity Registration system can be a single client Application, or web based application or even a client server application, it could be also online or offline.

If an identity registration client is confirmed to be an external building block it will most probably be more related to the Registration Building block. It must have its own APIs and own rules, tools and capture technologies compatible with the Identity Building Block's OpenAPIs.

The client has to deal with secure interfacing; where biometrics is being used with biometrics capture devices, and performing some operations on the biometrics such as quality checks, liveness checks etc. These interfaces will be part of the biometric services. The data capture formats for biometrics will also have to be based on open standards to ensure compatibility and portability.

## 2.4 Integration with an Existing Identity System

It happens that some countries have an existing identity system they choose to reuse, like for example a National Population Register, a Civil Register or ID Document system. In that case the existing system will need to be equipped with the IDV BB Services Facade which will make its integration transparent toward the remainder of the GovStack.

<figure><img src="https://3457543697-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FWxDGFK8JvbnWnN3kch5n%2Fuploads%2Fgit-blob-4be42e7534703d609805b5ea0166b43bdaad3305%2FScreen%20Shot%202023-06-20%20at%2011.54.21%20AM.png?alt=media" alt=""><figcaption></figcaption></figure>