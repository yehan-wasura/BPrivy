/**********************************************************\

  Auto-generated BPrivy.cpp

  This file contains the auto-generated main plugin object
  implementation for the BPrivy project

\**********************************************************/

#include "BPrivyAPI.h"

#include "BPrivy.h"
#include <DOM/Window.h>
#include "Utils.h"
#include <libcrypt.h>
#ifdef WIN32
#include <ObjBase.h>
#include <Ole2.h>
#endif

///////////////////////////////////////////////////////////////////////////////
/// @fn BPrivy::StaticInitialize()
///
/// @brief  Called from PluginFactory::globalPluginInitialize()
///
/// @see FB::FactoryBase::globalPluginInitialize
///////////////////////////////////////////////////////////////////////////////
void BPrivy::StaticInitialize()
{
    // Place one-time initialization stuff here; As of FireBreath 1.4 this should only
    // be called once per process

	crypt::initLibcrypt();

#ifdef WIN32
	// Note from Sumeet: Initialize COM. COINIT_MULTITHREADED implies that it is our responsibility to
	// synchronize calls to a given COM object. This is not a problem for us since the
	// incoming calls to the plugin are all handled by one thread anyway, even if multiple
	// plugin instances may be initialized per plugin-process (i.e. per browser). Per FB
	// documentation, there is one plugin-process per browser and it hosts all plugin-instances
	// embedded in that browser (e.g. in various windows, tabs and frames of Google-chrome).
	// NOTE: COINIT_MULTITHREADED *is* a problem for us since the WiX file generated by FB
	// claims the plugin to be threaded=apartment. Hence it is safest to go with COINIT_APARTMENTTHREADED.
	// That's alright for us since we don't expect to serve concurrent calls from a browser. In
	// testing it has worked without a hitch.
	//HRESULT r = CoInitializeEx(NULL, COINIT_MULTITHREADED); // Requires Ole32.lib
	HRESULT r = OleInitialize(NULL); // Implies COINIT_APARTMENTTHREADED, i.e. single threaded apartment
#endif
}

///////////////////////////////////////////////////////////////////////////////
/// @fn BPrivy::StaticDeinitialize()
///
/// @brief  Called from PluginFactory::globalPluginDeinitialize()
///
/// @see FB::FactoryBase::globalPluginDeinitialize
///////////////////////////////////////////////////////////////////////////////
void BPrivy::StaticDeinitialize()
{
    // Place one-time deinitialization stuff here. As of FireBreath 1.4 this should
    // always be called just before the plugin library is unloaded

	crypt::unloadLibcrypt(); // unload openssl strings

#ifdef WIN32
	//CoUninitialize(); // Uninitialize COM. Requires Ole32.lib
	OleUninitialize();
#endif
}

///////////////////////////////////////////////////////////////////////////////
/// @brief  BPrivy constructor.  Note that your API is not available
///         at this point, nor the window.  For best results wait to use
///         the JSAPI object until the onPluginReady method is called
///////////////////////////////////////////////////////////////////////////////
BPrivy::BPrivy()
{
}

///////////////////////////////////////////////////////////////////////////////
/// @brief  BPrivy destructor.
///////////////////////////////////////////////////////////////////////////////
BPrivy::~BPrivy()
{
    // This is optional, but if you reset m_api (the shared_ptr to your JSAPI
    // root object) and tell the host to free the retained JSAPI objects then
    // unless you are holding another shared_ptr reference to your JSAPI object
    // they will be released here.
    releaseRootJSAPI();
    m_host->freeRetainedObjects();
}

void BPrivy::onPluginReady()
{
    // When this is called, the BrowserHost is attached, the JSAPI object is
    // created, and we are ready to interact with the page and such.  The
    // PluginWindow may or may not have already fire the AttachedEvent at
    // this point.
}

void BPrivy::shutdown()
{
    // This will be called when it is time for the plugin to shut down;
    // any threads or anything else that may hold a shared_ptr to this
    // object should be released here so that this object can be safely
    // destroyed. This is the last point that shared_from_this and weak_ptr
    // references to this object will be valid
}

///////////////////////////////////////////////////////////////////////////////
/// @brief  Creates an instance of the JSAPI object that provides your main
///         Javascript interface.
///
/// Note that m_host is your BrowserHost and shared_ptr returns a
/// FB::PluginCorePtr, which can be used to provide a
/// boost::weak_ptr<BPrivy> for your JSAPI class.
///
/// Be very careful where you hold a shared_ptr to your plugin class from,
/// as it could prevent your plugin class from getting destroyed properly.
///////////////////////////////////////////////////////////////////////////////
FB::JSAPIPtr BPrivy::createJSAPI()
{
	FB::DOM::WindowPtr pWin = m_host->getDOMWindow();
	std::string loc = pWin->getLocation();
#ifndef DEBUG
	std::string allowed("chrome-extension://bkpchbpkjdeiplcjdgnopcjlelddanlp");
	if (loc.compare(0, allowed.size(), allowed) != 0)
    {
		/*pWin->alert(std::string(
			"Unauthorized website (possibly malicious) [") + loc + "] is trying to access your drive."
			" Rest assured that we have denied it access, but please email support@untrix.com if possible");*/
		return boost::shared_ptr<BPrivyAPI>((BPrivyAPI*)NULL);
	}
	else
#endif // DEBUG
	{
		// m_host is the BrowserHost
		return boost::make_shared<BPrivyAPI>(FB::ptr_cast<BPrivy>(shared_from_this()), m_host);
	}
}

bool BPrivy::onMouseDown(FB::MouseDownEvent *evt, FB::PluginWindow *)
{
    //printf("Mouse down at: %d, %d\n", evt->m_x, evt->m_y);
    return false;
}

bool BPrivy::onMouseUp(FB::MouseUpEvent *evt, FB::PluginWindow *)
{
    //printf("Mouse up at: %d, %d\n", evt->m_x, evt->m_y);
    return false;
}

bool BPrivy::onMouseMove(FB::MouseMoveEvent *evt, FB::PluginWindow *)
{
    //printf("Mouse move at: %d, %d\n", evt->m_x, evt->m_y);
    return false;
}
bool BPrivy::onWindowAttached(FB::AttachedEvent *evt, FB::PluginWindow *)
{
    // The window is attached; act appropriately
    return false;
}

bool BPrivy::onWindowDetached(FB::DetachedEvent *evt, FB::PluginWindow *)
{
    // The window is about to be detached; act appropriately
    return false;
}

