/*
 * This file is here only to trigger page scanning (normally done by boot loader) when
 * bp_cs_cat.js is directly loaded for debugging purposes (and the boot loader is not).
 * This file does not get loaded in production.
 */

if (BP_MOD_BOOT.scan(document)) 
{
    BP_DLL.onDllLoad();
}
else 
{
    BP_MOD_BOOT.observe(document, function(node,observer)
    {
        if (BP_MOD_BOOT.scan(node)) {
            observer.disconnect();
            BP_DLL.onDllLoad();
        }
    });
}
