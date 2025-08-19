# Vaultroom


## What is it ?

Vaultroom is a web based, security first solution to confidential message and file sharing; It allows users (you YES you) to create 'Secrets'. These are messages, and optionally files, which are accessible through ONE-TIME links which blow up after use - meaning that the link can only be shared and clicked ONCE, after that the secret is erased from storage and entirely re-accessible unless explicitly resent through the same process by the sender. These links also have a TTL value addressible by you, ranging from set intervals of 1 minute to 1 day which cause the secret to 'Expire' and the link along with it, if it hasnt been accessed in the time given to it. 

The core concept behind Vaultroom is for a secure way to pass around confidential or sensitive information, a few prime examples being: .env variables, NDAs, employee records, the list goes on. Vaultroom ensures this security in a couple ways:

1. By decentralising the file: 
Sharing files or messages through methods like instant messaging, email, or fileshares, while convenient, leave a the file exposed and available at all times unless explicitly removed by the sender. This means that the content of the files are kept on record at all times and freely available to download and share whilst they alive within a chat. This can be, in my own terms - a big No No, and in a professional sense, unsecure and at risk. Suppose for example you wish to share .env variables or API keys to a remote colleague, sending them via whatsapp or email, while on-paper is secure, in reality leaves room for exposure and leaking.

Vaultroom solves this by isolating the file from its sending process entirely, all a user would need to do is create the 'Secret', pass along the access link, and boom: the recipient receives the file or message and the only trace on record was an access link, which no longer works!

2. TTLs and One-time nature:
As I've already touched on, the secrets themselves dont live forever, they expire after a set amount of time or once theyve been accessed once by the recipient. After that, they're gone, wiped from the temporary storage, as though it were never sent. Think of it like a Spy-esque self destrucing message.

3. Backend Encryption:
The file contents are also ensured to be secure from even me, the developer. When you create a secret on the frontend, it is passed to the backend and verified, validated and all that good stuff, but more importantly it is encrypted before storing in the Upstash cache. This means that it has double layer encryption ensuring that your secret STAYS secret from all eyes except the recipient.


## What is supported - File types:
So far, only PDFs, JPEGs, and text docuements are supported to be passed as messages. Image prievew and text documents are natively supported in the frontend, however a PDF worker is utilized to allow for .pdf documents to be viewable. As such it is required that any other types (word, powerpoint, etc..) are converted into PDF format to be passed off as a viewable secret.


## How it works - Technical Stuff

### General Workflow:
- The frontend gathers the user's data in the form of text and an optional attached file. This data is then encoded and sent to the backend server for processing. 
- In the backend server, the file data is ensured to be of the correct specifications and within tolerance levels of file sizes before being passed off for storing.
- At this stage the file data is encrypted using Symmetric Fernet encryption and stored as a key-value pair in a redis cache.
- Once Stored the backend returns a API-endpoint link associated with the key-value of the redis store. 
- When clicked the file is fetched from the backend once more, which retieves, decrypts, and scrubs the file from the redis cache before parsing and serving back to the frontend.