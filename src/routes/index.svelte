<script lang="ts">
	import { ethers } from 'ethers';
	import { fly } from 'svelte/transition';
	import * as secp from '@noble/secp256k1';

	interface EthBody {
		body: {
			address: string;
			text: string;
		};
		hash: string;
		ethSig: string;
	}

	interface EventInterface {
		id: string;
		pubkey: string;
		created_at: number;
		kind: number;
		tags: string[];
		content: string; // EthBody but string
		sig: string;
	}

	let signedEvent: EventInterface;
	let noWallet = false;

	async function createEvent() {
		if (!window.ethereum) noWallet = true;
		const provider = new ethers.providers.Web3Provider(window.ethereum);

		// get permisison
		await provider.send('eth_requestAccounts', []);

		const privkey = secp.utils.randomPrivateKey();
		const pubkey = secp.schnorr.getPublicKey(privkey);
		const pubkeyHex = secp.utils.bytesToHex(pubkey);

		// data and signature
		const message =
			'MINT CHOCOLATE CHIP ICE CREAM IS THE BEST ICE CREAM FLAVOR!---Create NIP-01 event with MetaMask on nip01metamask.netlify.app.';
		const signer = provider.getSigner();
		const rawAddress = await signer.getAddress();
		const ethAddress = rawAddress.toLowerCase();

		const ethBody = {
			address: ethAddress,
			text: message
		};

		let utf8Encode = new TextEncoder();
		const ethHash = await secp.utils.sha256(utf8Encode.encode(JSON.stringify(ethBody)));
		const ethSig = await signer.signMessage(ethHash);

		const ethEvent: EthBody = {
			body: ethBody,
			hash: secp.utils.bytesToHex(ethHash),
			ethSig: ethSig
		};

		const unixTime = Math.floor(Date.now() / 1000);
		const data = [0, pubkeyHex, unixTime, 1, [], JSON.stringify(ethEvent)];
		console.log(data);
		const eventString = JSON.stringify(data);
		const eventByteArray = new TextEncoder().encode(eventString);
		const eventIdRaw = await secp.utils.sha256(eventByteArray);
		const eventId = secp.utils.bytesToHex(eventIdRaw);

		const signatureRaw = await secp.schnorr.sign(eventId, privkey);
		const schnorrSignature = secp.utils.bytesToHex(signatureRaw);

		signedEvent = {
			id: eventId,
			pubkey: secp.utils.bytesToHex(pubkey),
			created_at: unixTime,
			kind: 1,
			tags: [],
			content: JSON.stringify(ethEvent),
			sig: schnorrSignature
		};

		await fetch('/push', {
			method: 'POST',
			body: JSON.stringify(signedEvent)
		});
	}
</script>

<svelte:head>
	<title>gm MetaMask NIP-01 gm</title>
</svelte:head>

<div class="flex justify-center items-center h-screen mx-auto">
	{#if !noWallet}
		{#if signedEvent}
			<div
				class="flex flex-col max-w-sm md:max-w-lg lg:max-w-2xl bg-fuchsia-50 border-2 border-fuchsia-400 p-8 rounded-md"
				in:fly={{ y: 10, duration: 200, delay: 100 }}
			>
				<p class="text-center mb-10 text-4xl">
					<a
						class="text-fuchsia-600 underline"
						href="https://github.com/nostr-protocol/nips/blob/master/01.md">NIP-01</a
					> + MetaMask
				</p>
				<pre class="overflow-x-scroll mb-10">{JSON.stringify(signedEvent, null, 2)}</pre>
				<p class="text-center text-4xl">
					@~
					<a class="text-fuchsia-600 underline" href="https://github.com/vinliao/metamask-nostr"
						>GitHub</a
					>
					@~
				</p>
			</div>
		{:else}
			<button
				class="px-7 py-3 text-4xl font-normal border-2 bg-fuchsia-50 border-fuchsia-400 border-b-4 rounded-md hover:bg-fuchsia-700 hover:border-fuchsia-800 hover:text-fuchsia-50 transition ease-in-out focus:outline-none"
				on:click={createEvent}>MetaMask NIP-01 @~</button
			>
		{/if}
	{:else}
		<div class="flex flex-col text-center space-y-2">
			<p
				class="text-4xl text-red-50 rounded-md bg-red-700 px-7 py-3 border-2 border-red-800 font-bold"
				in:fly={{ y: 10, duration: 200, delay: 100 }}
			>
				MetaMask not found!
			</p>
			<p class="text-4xl" in:fly={{ y: 10, duration: 200, delay: 250 }}>
				Download MetaMask on <a class="text-fuchsia-600 underline" href="https://metamask.io"
					>metamask.io</a
				>
			</p>
		</div>
	{/if}
</div>
