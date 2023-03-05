# Flex Virtual Assistant with Google Dialogflow CX and OpenAI

## Table of Contents

## Background

The Virtual Assitant was built for Enterprise Connect 2023 to be an augmentation on the [NRF Demo](https://vimeo.com/785989003/1bac402f21), provide both an omnichannel Conversational AI feature integration with Google Dialogflow CX, as well as a Virtual Assistant in Flex supporting Conversational AI Transcription, AI-driven Summarization, and AI-driven Next Best Actions. The Virtual Agent and Transcription components are tied to our integration capabilities with Google Dialogflow CX, and the Summarization and Next Best Actions are "Art of the Possible" technical demonstrations that leverage OpenAI.

The Flex Plugin components for the Virtual Assistant are built with Twilio Paste and are intended to be resuable components in Builder.io

## Conversational AI Deflection with a Dialogflow CX Virtual Agent
-----------------------------------TBD-------------------------------------
Dialogflow Agent Setup/Config
Segment Integration
Studio Flow
Functions
Live Agent Escalation
Differences with Voice vs. Digital Channels

## Integration with OpenAI
-----------------------------------TBD-------------------------------------

Why this over CCAI (and no we are not using CCAI at all for this project....CCAI involves X, Y, Z, which we are not doing, rather are using OpenAI instead....this could change in the near/mid/long term)

### Summarization
-----------------------------------TBD-------------------------------------
Why not using Google for this
Configuration
API Setup
Prompt Engineering
Differences with Voice vs. Digital Channels

## Next Best Actions
-----------------------------------TBD-------------------------------------
Configuration
API Setup
Prompt Engineering
Differences with Voice vs. Digital Channels
Differentiation

## Topology of this Repository

### functions Folder
The Funcitons folder contains both digital channel and voice specific functions. Importantly, it also includes the google credentials json example file that you will need to point to from the dialogflowCX.js. You need to have (or create) a service account in Google Cloud IAM and then download a JSON key, which you will then add as a Twilio Asset in your Functions Service. You will also need to make sure the Asset is changed to "Private" or you will get an error at runtime.

There's a .env.example file that will give you what you need with descriptions on how to find everything. 90% of it is Dialogflow specific. There's a Sync Service SID required for the Voice component of the Dialogflow integration. How you decide to deploy these functions (eg. CLI vs. Direct), what you name them, how you organize them, is entirely up to you.

### src/components folder
Here's where all of the React Functional Components live
There's a "digital" and "voice" folder to keep these functional components separate. Each has 4 functional components. While there are a lot of similarities between the voice and digital components, there are also key differences, and I choice to separate them so they could be built/maintained/iterated over time

### studio_flows folder
I've exported the JSON for both digital and voice studio flows. You can import these into your own project and set them up specific to your project settings.

## Installation 

Prerequisites

Local Dev Setup
- you are running node v16 or above
- twilio cli 5.2.0 or above is [installed](https://www.twilio.com/docs/twilio-cli/getting-started/install) (`twilio --version`)
- twilio flex plugins 6.0.2 or above is [installed](https://www.twilio.com/docs/flex/developer/plugins/cli/install#install-the-flex-plugins-cli) (`twilio plugins`, `twilio plugins:install @twilio-labs/plugin-flex@latest`)
- twilio serverless plugin 3.0.4 or above is [installed](https://www.twilio.com/docs/labs/serverless-toolkit/getting-started#install-the-twilio-serverless-toolkit) (`twilio plugins`, `twilio plugins:install @twilio-labs/plugin-serverless@latest`)
- `twilio profiles:list` has an active account set.
- have the twilio auth token for your account ready

Account/Console Configuration
- Create your Twilio Flex Account
- Create your Dialogflow CX Project, and setup a Pre-Built Agent or your own Agent
- Get the Studio Flows in this Repo imported and configured in your environment
- Make sure you update your Flex Conversations Setup to point to your imported Studio Flow for Conversations

Github
- Clone or Download a ZIP of this repo 

Running and Deploying Functions
- I recommend just creating a Function Service and adding the functions manually
- Make sure you get your Environment Variables added and populated correctly
- Download your Google Cloud IAM Service Account Key and add it to the Assets in your Twilio Function Service. Make the name of the file matches the process.env.GOOGLE_APPLICATION_CREDENTIALS line in your dialogflowCX.js function
- Add a Dependency for @google-cloud/dialogflow-cx (I used verison 3.4.0, so that should be a minium version. I had previously used 3.1.0 but that version did not have the latest API updates eg. speciying "channel" in the queryParams for channel-specific responses)
- Make sure your Twilio NPM dependency is at least 3.77.0
- Deploy all your updates


Running and Deploying the Plugin

```bash
npm install
```

```bash
npm install @twilio-paste/core@latest @twilio-paste/icons@latest --legacy-peer-deps
```

```bash
twilio flex:plugins:start
```

## Segment
-----------------------------------TBD-------------------------------------
This project is tightly coupled to Segment Profiles and Events. It is possible to remove this dependency, but your AI quality will suffer, so do this at your own risk.

## Builder.io
-----------------------------------TBD-------------------------------------
TBD what needs to be documented here for builder. A "How to use" Guide?

## Flex Serverless Template
-----------------------------------TBD-------------------------------------
