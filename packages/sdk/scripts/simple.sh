POOL_NAME="JARVIS"

# get these from the console
export TOUCH=0xcfeD223fAb2A41b5a5a5F9AaAe2D1e882cb6Fe2D
export TRIBE=0xdE5491f774F0Cb009ABcEA7326342E105dbb1B2E
export MPO=0x05c854B681a855a1688f5473C48367c4Ab1Dc021
export IRM=0x8ACEe021a27779d8E98B9650722676B850b25E11
export STRATEGY=0x913bbCFea2f347a24cfCA441d483E7CBAc8De3Db


#STRATEGY=0xcfeD223fAb2A41b5a5a5F9AaAe2D1e882cb6Fe2D
#FLYWHEEL=0x1411CB266FCEd1587b0AA29E9d5a9Ef3Db64A9C5

ywsh pool:create --name "$POOL_NAME" --creator deployer --price-oracle $MPO --close-factor 50 --liquidation-incentive 8 --enforce-whitelist false --network localhost
ywsh market:create --pool-name $POOL_NAME --creator deployer --symbol jBRL --network localhost

ywmh oracle:set-price --address $TOUCH --price "0.01" --network localhost
ywmh oracle:set-price --address $TRIBE --price "0.001" --network localhost

# no dynamic rewards
ywmh market:create --asset-config "$POOL_NAME,deployer,CErc20PluginDelegate,$TRIBE,$IRM,0.01,0.9,1,0,true,$STRATEGY,'',''" --network localhost

# dynamic rewards
npx hardhat market:create --asset-config "$POOL_NAME,deployer,CErc20PluginRewardsDelegate,$TOUCH,$IRM,0.01,0.9,1,0,true,$STRATEGY,$FLYWHEEL,$REWARD" --network localhost

0x27e16c1f00000000000000000000000031d76a64bc8bbeffb601fac5884372def910f044