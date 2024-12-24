/* global ethers */
/* eslint prefer-const: "off" */

const { ethers } = require('hardhat')
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function deployDiamond () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]

  // DiamondCutFacet deployed: 0xEeEd78BbBD3Af11Cf4c33601b9dC49a707b33f30
  // Diamond deployed: 0xd26070dd63E40218E62a5468B3aFD49454D18A5b
  // DiamondInit deployed: 0x9Ff79dAA7773011909a53ADaCE077177BFCFa691

  // Deploying facets
  // DiamondLoupeFacet deployed: 0xab443862ab392453fB1B8888e15c3D9E80f75aC5
  // OwnershipFacet deployed: 0xfD567Ed18930B0265d0e95E635B658E584F9A8F8
  // ERC20Facet deployed: 0xaBb1Bd87bbAFDd906Ad6f3b1D9a5cC24E4cD2aAe


  // deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  // const DiamondInit = await ethers.getContractFactory('DiamondInit')
  const diamondInit = await ethers.getContractAt("DiamondInit", "0x93AD5be6E1352c6Bf9a0d92b328A85869A1dDAf9")
  await diamondInit.deployed()
  console.log('DiamondInit deployed:', diamondInit.address)

  // deploy facets
  console.log('')
  console.log('Deploying facets')
  const FacetNames = [
    'ERC20WithdrawFacet'
  ]
  const cut = []
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName)
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${facet.address}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  // upgrade diamond with facets
  console.log('')
  console.log('Diamond Cut:', cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut',"0x43fBA1315c258Db85FCbED7253E3A11305430F5d")
  let tx
  let receipt

  // call to init function
  let functionCall = diamondInit.interface.encodeFunctionData('init')
  tx = await diamondCut.diamondCut(cut, "0x93AD5be6E1352c6Bf9a0d92b328A85869A1dDAf9", functionCall)
  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')
  // return diamond.address

  const token = await ethers.getContractAt("ERC20Facet", "0x1f163488585A1A02d1dEB251d3Eab6658Ba53Cfb");
  const name = await token.name();
  const balance = await token.balanceOf(contractOwner.address);
  console.log(name);
  console.log(Number(balance))

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployDiamond = deployDiamond